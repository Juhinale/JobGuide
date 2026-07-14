import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { getProblemById } from "@/lib/problems";

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const unlinkPromise = promisify(fs.unlink);

const PYTHON_ANALYZER_SCRIPT = `
import ast
import json
import sys
import copy
import tokenize
from io import BytesIO

class SymbolTableVisitor(ast.NodeVisitor):
    def __init__(self):
        self.symbols = {}
        self.scope_stack = ["global"]

    def visit_FunctionDef(self, node):
        self.scope_stack.append(node.name)
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.add_symbol(target.id, node.value, node.lineno)
        self.generic_visit(node)

    def visit_AnnAssign(self, node):
        if isinstance(node.target, ast.Name):
            self.add_symbol(node.target.id, node.value, node.lineno, node.annotation)
        self.generic_visit(node)

    def add_symbol(self, name, value_node, lineno, annotation=None):
        scope = self.scope_stack[-1]
        type_name = "unknown"
        
        if annotation:
            if isinstance(annotation, ast.Name):
                type_name = annotation.id
            elif isinstance(annotation, ast.Attribute):
                type_name = annotation.attr
            elif isinstance(annotation, ast.Constant):
                type_name = str(annotation.value)
        elif value_node:
            if isinstance(value_node, ast.Constant):
                type_name = type(value_node.value).__name__
            elif isinstance(value_node, ast.List):
                type_name = "list"
            elif isinstance(value_node, ast.Dict):
                type_name = "dict"
            elif isinstance(value_node, ast.Set):
                type_name = "set"
            elif isinstance(value_node, ast.Call):
                if isinstance(value_node.func, ast.Name):
                    type_name = value_node.func.id
        
        if name not in self.symbols:
            self.symbols[name] = []
            
        self.symbols[name].append({
            "type": type_name,
            "scope": scope,
            "line": lineno
        })

class TypeChecker(ast.NodeVisitor):
    def __init__(self):
        self.errors = []
        self.scope_types = {} # var_name -> type_name
    
    def get_type_name(self, node):
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Constant):
            return type(node.value).__name__
        elif isinstance(node, ast.BinOp):
             # Simple inference
            left_type = self.get_type_name(node.left)
            right_type = self.get_type_name(node.right)
            if left_type == "float" or right_type == "float":
                return "float"
            if left_type == "int" and right_type == "int":
                return "int"
            return "unknown"
        return "unknown"

    def visit_AnnAssign(self, node):
        # Handle: x: int = 10
        if isinstance(node.target, ast.Name):
            var_name = node.target.id
            declared_type = "unknown"
            
            if isinstance(node.annotation, ast.Name):
                declared_type = node.annotation.id
            
            self.scope_types[var_name] = declared_type
            
            if node.value:
                actual_type = self.get_type_name(node.value)
                if declared_type != "unknown" and actual_type != "unknown":
                    if declared_type == "int" and actual_type == "float":
                         self.errors.append(f"Type Error at line {node.lineno}: Incompatible types for '{var_name}'. Expected 'int', got 'float'.")
                    elif declared_type == "float" and actual_type == "str":
                         self.errors.append(f"Type Error at line {node.lineno}: Incompatible types for '{var_name}'. Expected 'float', got 'str'.")
                    elif declared_type == "int" and actual_type == "str":
                         self.errors.append(f"Type Error at line {node.lineno}: Incompatible types for '{var_name}'. Expected 'int', got 'str'.")
        self.generic_visit(node)

    def visit_Assign(self, node):
        # Handle: x = 3.5 (check if x was declared as int)
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id
                if var_name in self.scope_types:
                    declared_type = self.scope_types[var_name]
                    actual_type = self.get_type_name(node.value)
                    
                    if declared_type != "unknown" and actual_type != "unknown":
                        if declared_type == "int" and actual_type == "float":
                             self.errors.append(f"Type Error at line {node.lineno}: Incompatible types for '{var_name}'. Expected 'int', got 'float'.")
                        elif declared_type == "int" and actual_type == "str":
                             self.errors.append(f"Type Error at line {node.lineno}: Incompatible types for '{var_name}'. Expected 'int', got 'str'.")

        self.generic_visit(node)


class TACGen(ast.NodeVisitor):
    def __init__(self):
        self.instructions = [] # List of dicts: {op, arg1, arg2, result, type, label?}
        self.temp_counter = 1
        self.label_counter = 1

    def new_temp(self):
        t = f"t{self.temp_counter}"
        self.temp_counter += 1
        return t

    def new_label(self):
        l = f"L{self.label_counter}"
        self.label_counter += 1
        return l
    
    def add_instr(self, op, arg1=None, arg2=None, result=None, label=None):
        self.instructions.append({
            "op": op,
            "arg1": arg1,
            "arg2": arg2,
            "result": result,
            "label": label
        })

    def visit_BinOp(self, node):
        left = self.visit(node.left)
        right = self.visit(node.right)
        temp = self.new_temp()
        
        op_map = {
            ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/",
            ast.FloorDiv: "//", ast.Mod: "%", ast.Pow: "**",
            ast.LShift: "<<", ast.RShift: ">>", ast.BitOr: "|",
            ast.BitXor: "^", ast.BitAnd: "&", ast.MatMult: "@"
        }
        op = op_map.get(type(node.op), "?")
        
        self.add_instr(op, arg1=left, arg2=right, result=temp)
        return temp

    def visit_Compare(self, node):
        left = self.visit(node.left)
        ops_map = {
            ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=",
            ast.Gt: ">", ast.GtE: ">=", ast.Is: "is", ast.IsNot: "is not",
            ast.In: "in", ast.NotIn: "not in"
        }
        
        if node.ops:
            op = ops_map.get(type(node.ops[0]), "?")
            right = self.visit(node.comparators[0])
            temp = self.new_temp()
            self.add_instr(op, arg1=left, arg2=right, result=temp)
            return temp
        return left

    def visit_Constant(self, node):
        if isinstance(node.value, str):
            return f"'{node.value}'"
        return str(node.value)

    def visit_Name(self, node):
        return node.id

    def visit_Assign(self, node):
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            target = node.targets[0].id
            value = self.visit(node.value)
            self.add_instr("=", arg1=value, result=target)
        else:
            self.generic_visit(node)

    def visit_If(self, node):
        condition = self.visit(node.test)
        
        label_else = self.new_label()
        label_end = self.new_label()
        
        self.add_instr("ifFalse", arg1=condition, result=label_else)
        
        for stmt in node.body:
            self.visit(stmt)
        
        self.add_instr("goto", result=label_end)
        self.add_instr("label", label=label_else)
        
        for stmt in node.orelse:
            self.visit(stmt)
            
        self.add_instr("label", label=label_end)

    def visit_While(self, node):
        label_start = self.new_label()
        label_end = self.new_label()
        
        self.add_instr("label", label=label_start)
        
        condition = self.visit(node.test)
        self.add_instr("ifFalse", arg1=condition, result=label_end)
        
        for stmt in node.body:
            self.visit(stmt)
            
        self.add_instr("goto", result=label_start)
        self.add_instr("label", label=label_end)

    def visit_For(self, node):
        label_start = self.new_label()
        label_end = self.new_label()
        
        iterable = self.visit(node.iter)
        iter_temp = self.new_temp()
        self.add_instr("call", arg1="iter", arg2=iterable, result=iter_temp)
        
        self.add_instr("label", label=label_start)
        val_temp = self.new_temp()
        
        # Simulate next
        # simplified for TAC
        self.add_instr("call", arg1="next", arg2=iter_temp, result=val_temp)
        self.add_instr("if", arg1=val_temp, arg2="STOP", result=label_end, op="==") 
        
        if isinstance(node.target, ast.Name):
            self.add_instr("=", arg1=val_temp, result=node.target.id)
            
        for stmt in node.body:
            self.visit(stmt)
            
        self.add_instr("goto", result=label_start)
        self.add_instr("label", label=label_end)

    def visit_Expr(self, node):
        self.visit(node.value)
    
    def visit_Call(self, node):
         func_name = "unknown"
         if isinstance(node.func, ast.Name):
             func_name = node.func.id
         elif isinstance(node.func, ast.Attribute):
             # Simplified attribute handling
             func_name = node.func.attr
         
         args = []
         for arg in node.args:
             args.append(self.visit(arg))
             
         temp = self.new_temp()
         args_str = ", ".join(args)
         self.add_instr("call", arg1=func_name, arg2=args_str, result=temp)
         return temp

def instrs_to_string(instrs):
    lines = []
    for i in instrs:
        if i["op"] == "label":
            lines.append(f"{i['label']}:")
        elif i["op"] == "=":
            lines.append(f"{i['result']} = {i['arg1']}")
        elif i["op"] == "ifFalse":
            lines.append(f"ifFalse {i['arg1']} goto {i['result']}")
        elif i["op"] == "goto":
            lines.append(f"goto {i['result']}")
        elif i["op"] == "call":
            lines.append(f"{i['result']} = call {i['arg1']}({i['arg2']})")
        elif i["op"] == "if":
             lines.append(f"if {i['arg1']} {i.get('original_op', '==')} {i['arg2']} goto {i['result']}")
        else:
            lines.append(f"{i['result']} = {i['arg1']} {i['op']} {i['arg2']}")
    return lines

class TACOptimizer:
    def __init__(self, instructions):
        self.instructions = copy.deepcopy(instructions)
        self.logs = []

    def optimize(self):
        # Multi-pass optimization
        changed = True
        pass_count = 0
        while changed and pass_count < 5:
            changed = False
            
            # Constant Folding
            if self.constant_folding():
                changed = True
            
            # Common Subexpression Elimination
            if self.cse():
                changed = True
                
            # Dead Code Elimination
            if self.dead_code_elimination():
                changed = True
                
            pass_count += 1
            
        # Loop Invariant Code Motion (separate pass, usually runs once or carefully)
        self.licm()
        
        return self.instructions, self.logs

    def is_constant(self, val):
        if not isinstance(val, str):
            # It's a number
            return True
        if val.startswith("'") and val.endswith("'"):
            return True
        try:
            float(val)
            return True
        except ValueError:
            return False

    def get_const_value(self, val):
        if not isinstance(val, str):
            return val
        if val.startswith("'") and val.endswith("'"):
            return val[1:-1]
        try:
            if "." in val:
                return float(val)
            return int(val)
        except:
            return val

    def constant_folding(self):
        changed = False
        for i in self.instructions:
            if i["op"] in ["+", "-", "*", "/", "//", "%", "**"] and self.is_constant(i["arg1"]) and self.is_constant(i["arg2"]):
                v1 = self.get_const_value(i["arg1"])
                v2 = self.get_const_value(i["arg2"])
                try:
                    res = eval(f"{v1} {i['op']} {v2}")
                    if isinstance(res, str):
                        res_str = f"'{res}'"
                    else:
                        res_str = str(res)
                    
                    self.logs.append({
                        "name": "Constant Folding",
                        "details": f"{i['arg1']} {i['op']} {i['arg2']} -> {res_str}"
                    })
                    
                    # Transform to assignment
                    i["op"] = "="
                    i["arg1"] = res_str
                    i["arg2"] = None
                    changed = True
                except:
                    pass
        return changed

    def dead_code_elimination(self):
        # Convert to list for easier index management, but we operate in place
        # Naive: remove assignments to temps that are never used later
        # We need a liveness analysis or use count
        
        used_vars = set()
        # Find all used variables
        for i in self.instructions:
            if i["arg1"] and not self.is_constant(i["arg1"]): used_vars.add(i["arg1"])
            if i["arg2"] and not self.is_constant(i["arg2"]): used_vars.add(i["arg2"])
            if i["op"] == "ifFalse": used_vars.add(i["arg1"])
            # 'call' arguments in arg2 string are not parsed here, simplified
            
        new_instrs = []
        changed = False
        
        for i in self.instructions:
            is_dead = False
            if i["op"] == "=" or i["op"] in ["+", "-", "*", "/"]:
                target = i["result"]
                # If target is a temp (starts with t) and not in used_vars
                if target and target.startswith("t") and target not in used_vars:
                    # Check if it has side effects? pure ops don't
                    is_dead = True
            
            if is_dead:
                self.logs.append({
                    "name": "Dead Code Elimination",
                    "details": f"Removed unused assignment to {i['result']}"
                })
                changed = True
            else:
                new_instrs.append(i)
                
        self.instructions = new_instrs
        return changed

    def cse(self):
        changed = False
        # Look for identical RHS
        # Map: "op arg1 arg2" -> temp_var
        expr_map = {}
        
        for i in self.instructions:
            if i["op"] in ["+", "-", "*", "/", "call"]: # Supported ops for CSE
                expr_key = f"{i['op']} {i['arg1']} {i['arg2']}"
                
                if expr_key in expr_map:
                    # Found duplicate
                    existing_temp = expr_map[expr_key]
                    self.logs.append({
                        "name": "Common Subexpression",
                        "details": f"Reused {existing_temp} for {expr_key}"
                    })
                    
                    # Convert to assignment
                    i["op"] = "="
                    i["arg1"] = existing_temp
                    i["arg2"] = None
                    changed = True
                else:
                    expr_map[expr_key] = i["result"]
                    
        return changed

    def licm(self):
        # Very basic LICM: if a loop exists, move constants out?
        # Requires Loop analysis (Head, Body, Exit).
        # Simplified: Identify While/For loops by labels. 
        # Find invariants in the simplified instructions.
        pass

class AssemblyGen:
    def __init__(self, instructions):
        self.instructions = instructions
        self.asm = []
        
    def generate(self):
        self.asm.append("; Pseudo-Assembly Generation")
        self.asm.append(".section .text")
        self.asm.append(".global _start")
        self.asm.append("_start:")
        
        for i in self.instructions:
            if i["op"] == "label":
                self.asm.append(f"{i['label']}:")
            elif i["op"] == "=":
                self.asm.append(f"    MOV {i['result']}, {i['arg1']}")
            elif i["op"] == "+":
                 self.asm.append(f"    ADD {i['result']}, {i['arg1']}, {i['arg2']}")
            elif i["op"] == "-":
                 self.asm.append(f"    SUB {i['result']}, {i['arg1']}, {i['arg2']}")
            elif i["op"] == "*":
                 self.asm.append(f"    IMUL {i['result']}, {i['arg1']}, {i['arg2']}")
            elif i["op"] == "/":
                 self.asm.append(f"    IDIV {i['result']}, {i['arg1']}, {i['arg2']}")
            elif i["op"] == "ifFalse":
                self.asm.append(f"    CMP {i['arg1']}, 0")
                self.asm.append(f"    JE {i['result']}")
            elif i["op"] == "goto":
                self.asm.append(f"    JMP {i['result']}")
            elif i["op"] == "call":
                self.asm.append(f"    PUSH {i['arg2']}")
                self.asm.append(f"    CALL {i['arg1']}")
            elif i["op"] == "if":
                self.asm.append(f"    CMP {i['arg1']}, {i['arg2']}")
                self.asm.append(f"    JE {i['result']}") # Simplified
            else:
                 self.asm.append(f"    ; Unknown instruction: {i['op']}")
        
        self.asm.append("    RET")
        return self.asm

def ast_to_dict(node):
    if isinstance(node, ast.AST):
        fields = {}
        for field, value in ast.iter_fields(node):
            if isinstance(value, list):
                fields[field] = [ast_to_dict(item) for item in value]
            elif isinstance(value, ast.AST):
                fields[field] = ast_to_dict(value)
            else:
                fields[field] = value
        
        return {
            "type": type(node).__name__,
            "fields": fields
        }
    return node

def get_tokens(code):
    tokens = []
    # Tokenize.tokenize requires bytes
    try:
        for token in tokenize.tokenize(BytesIO(code.encode('utf-8')).readline):
            if token.type == tokenize.ENCODING: continue
            tokens.append({
                "type": tokenize.tok_name[token.type],
                "value": token.string,
                "line": token.start[0]
            })
    except Exception:
        pass # Simplified error handling
    return tokens

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("{}")
        sys.exit(0)
    
    filename = sys.argv[1]
    try:
        with open(filename, 'r') as f:
            code = f.read()
        tree = ast.parse(code)
        
        # Tokenization
        tokens = get_tokens(code)

        # Symbol Table
        visitor = SymbolTableVisitor()
        visitor.visit(tree)
        
        # Type Checker
        type_checker = TypeChecker()
        type_checker.visit(tree)
        
        # AST Data
        ast_data = ast_to_dict(tree)
        
        # TAC Generation
        tac_gen = TACGen()
        tac_gen.visit(tree)
        tac_raw = copy.deepcopy(tac_gen.instructions)
        tac_strings = instrs_to_string(tac_raw)
        
        # Optimization
        optimizer = TACOptimizer(tac_raw)
        optimized_tac_struct, logs = optimizer.optimize()
        optimized_tac_strings = instrs_to_string(optimized_tac_struct)

        # Assembly Generation
        asm_gen = AssemblyGen(optimized_tac_struct)
        assembly = asm_gen.generate()
        
        output = {
            "symbolTable": visitor.symbols,
            "typeErrors": type_checker.errors,
            "ast": ast_data,
            "tac": tac_strings,
            "optimizedTac": optimized_tac_strings,
            "optimizationLogs": logs,
            "tokens": tokens,
            "assembly": assembly
        }
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
`;

function parsePythonError(stderr: string) {
  if (!stderr) return null;

  const result: any = {
    line: null,
    type: "Runtime Error",
    message: stderr,
    suggestion: "Check your logic and syntax.",
    mentorship: null,
  };

  const lineMatch = stderr.match(/line (\d+)/);
  if (lineMatch) {
    result.line = parseInt(lineMatch[1], 10);
  }

  const errorMatch = stderr.match(/^(\w+Error): (.+)$/m);
  if (errorMatch) {
    result.type = errorMatch[1];
    result.message = errorMatch[2];
  }

  // AI Mentor Heuristics
  const errorMessage = result.message || stderr;

  if (
    result.type === "SyntaxError" ||
    errorMessage.includes("invalid syntax")
  ) {
    result.mentorship = {
      explanation:
        "You seemed to have broken a grammar rule of simple Python! This usually happens when you miss a symbol.",
      fix: "Check for missing colons `:` after `if`, `for`, `while` statements. Also check for unbalanced parentheses `()`.",
      conceptTitle: "Syntax in Programming",
      concept:
        "Just like English has grammar rules (periods, commas), programming languages have strict syntax. One missing character can confuse the computer!",
    };
    if (errorMessage.includes("EOL while scanning string literal")) {
      result.mentorship.explanation =
        "It looks like you started a text string but never finished it!";
      result.mentorship.fix =
        "Ensure you close your string with a matching quote (`'` or `\"`).";
    }
  } else if (result.type === "NameError") {
    result.mentorship = {
      explanation:
        "You tried to use a variable name that I don't recognize yet.",
      fix: "Make sure you defined the variable earlier in the code. Also check for spelling mistakes!",
      conceptTitle: "Variable Declaration",
      concept:
        "You must introduce (declare) a variable before you can use it. It's like calling someone by name before you've met them.",
    };
  } else if (result.type === "TypeError") {
    result.mentorship = {
      explanation:
        "You are trying to combine two things that don't belong together.",
      fix: "Check the types of your variables. complex operations like adding a Number to a Text string often fails.",
      conceptTitle: "Data Types",
      concept:
        "Computers treat numbers (Integers) and text (Strings) very differently. You usually can't mix them without converting one first.",
    };
  } else if (result.type === "IndentationError") {
    result.mentorship = {
      explanation: "Your code blocks aren't lined up correctly.",
      fix: "Python is very picky! Make sure all code inside an `if` or `function` is indented with the same number of spaces (usually 4).",
      conceptTitle: "Indentation and Scope",
      concept:
        "Indentation tells Python which lines of code belong together as a group (a block). Without it, Python gets lost.",
    };
  } else if (result.type === "ZeroDivisionError") {
    result.mentorship = {
      explanation: "You tried to divide a number by zero.",
      fix: "Change your divisor to something other than zero.",
      conceptTitle: "Mathematical Limits",
      concept:
        "Division by zero is mathematically impossible. Computers panic when you ask them to do it!",
    };
  }

  return result;
}

function parseJavaScriptError(stderr: string) {
  if (!stderr) return null;

  const result: any = {
    line: null,
    type: "Runtime Error",
    message: stderr,
    suggestion: "Check your logic and syntax.",
    mentorship: null,
  };

  const lineMatch = stderr.match(/:(\d+)(?::\d+)?/);
  if (lineMatch) {
    result.line = parseInt(lineMatch[1], 10);
  }

  const errorMatch = stderr.match(/^(\w+Error): (.+)$/m);
  if (errorMatch) {
    result.type = errorMatch[1];
    result.message = errorMatch[2];
  }

  // JS Heuristics
  const errorMessage = result.message || stderr;

  if (result.type === "ReferenceError") {
    result.mentorship = {
      explanation: "You are using a variable or function that doesn't exist.",
      fix: "Did you misspell it? Or maybe you forgot to declare it with `let` or `const`?",
      conceptTitle: "Scope & Definition",
      concept:
        "Code is read from top to bottom. You can't use a variable before it has been created.",
    };
  } else if (result.type === "SyntaxError") {
    result.mentorship = {
      explanation: "There is a grammar mistake in your code.",
      fix: "Look for missing curly braces `}`, semicolons `;`, or parentheses `()`.",
      conceptTitle: "Syntax Rules",
      concept:
        "Computers need precise instructions. A tiny typo makes the instruction impossible to understand.",
    };
  }

  return result;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { language, code, mode, problemId, runInput } = body;

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const matchId = Date.now();
  let filename = "";
  let analyzerFilename = "";
  let command = "";
  let analysisCommand = "";

  // Test Runner Variables
  let isTestMode = mode === "run" || mode === "submit" || mode === "run-tests";
  let finalCode = code;

  // Analysis variables
  let symbolTable = {};
  let astData = null;
  let tac = [];
  let optimizedTac = [];
  let optimizationLogs = [];
  let typeErrors = [];
  let tokens = [];
  let assembly = [];
  let testResults: any[] = [];
  let debugLogs: string[] = [];
  debugLogs.push(
    `Processing execution request for ${language} in mode ${mode}`,
  );

  try {
    if (isTestMode && problemId) {
      const problem = await getProblemById(problemId);
      if (problem && problem.functionName) {
        const { functionName, args } = problem;
        debugLogs.push(
          `Found problem: ${problem.title}, Function: ${functionName}, Args: ${args}`,
        );

        if (language === "python") {
          const jsonArgs = JSON.stringify(args);

          if (mode === "run") {
            // Clean input to avoid issues
            const safeInput = runInput || "";
            finalCode = `
import json
import sys
${code}

try:
    l = {}
    g = globals().copy()
    
    # 1. Try executing as a statement (e.g. "x = 5")
    try:
        exec("""${safeInput.replace(/"/g, '\\"')}""", g, l)
    except Exception:

        pass # Might be an expression, ignored for now

    # Extract args
    func_args = []
    arg_names = ${jsonArgs}
    
    parse_success = False

    # 2. Try to find arguments in the local scope (from exec)
    all_found = True
    temp_args = []
    for name in arg_names:
        if name in l:
            temp_args.append(l[name])
        else:
            all_found = False
            break
    
    if all_found:
        func_args = temp_args
        parse_success = True
    else:
        # 3. Fallback: Eval raw input
        # Attempt 3a: Single argument direct eval
        if len(arg_names) == 1:
            try:
                val = eval("""${safeInput.replace(/"/g, '\\"')}""", {}, {})
                func_args = [val]
                parse_success = True
            except Exception as e:
                parse_success = False
        
        # Attempt 3b: Multiple arguments separated by newlines
        if not parse_success and len(arg_names) > 1:
            try:
                input_str = """${safeInput.replace(/"/g, '\\"')}"""
                # Split by newline and filter empty lines (use splitlines for safety)
                lines = [line.strip() for line in input_str.splitlines() if line.strip()]
                
                if len(lines) == len(arg_names):
                    temp_args_list = []
                    all_eval_success = True
                    for line in lines:
                        try:
                            val = eval(line, {}, {})
                            temp_args_list.append(val)
                        except:
                            all_eval_success = False
                            break
                    
                    if all_eval_success:
                        func_args = temp_args_list
                        parse_success = True
                else:
                    # Optional: Store specific error reason to print later if needed?
                    pass
            except:
                pass

    if parse_success:
        result = ${functionName}(*func_args)
        print(result) # Output to stdout
    else:
        print("Error: Could not parse arguments from custom input.")
        
        missing_args = [name for name in arg_names if name not in l]
        print(f"Missing required arguments: {missing_args}")
        # print(f"Available variables: {list(l.keys())}")
        
        print("\\nPlease ensure your input matches one of these formats:")
        print("1. Variable assignments (e.g., 'nums = [1, 2]')")
        if len(arg_names) == 1:
            print("2. Raw value (e.g., '[1, 2]')")
        else:
            print("2. Raw values separated by newlines (one per argument)")

except Exception as e:
    print(f"Runtime Error: {e}")
`;
          } else if (mode === "submit") {
            const testCases = JSON.stringify(problem.testCases)
              .replace(/true/g, "True")
              .replace(/false/g, "False");
            finalCode = `
import json
import sys
${code}

# Test Runner
test_cases = ${testCases}
results = []
arg_names = ${jsonArgs}

for tc in test_cases:
    try:
        func_args = []
        input_str = tc["input"]
        
        # Try to parse comma-separated values
        if "," in input_str and len(arg_names) > 1:
            import ast
            try:
                parsed = ast.literal_eval(f"({input_str})")
                if isinstance(parsed, tuple):
                    func_args = list(parsed)
                else:
                    func_args = [parsed]
            except:
                # Fallback: smart split by comma
                parts = []
                depth = 0
                current = ""
                for char in input_str:
                    if char in "[{(":
                        depth += 1
                    elif char in "]})":
                        depth -= 1
                    elif char == "," and depth == 0:
                        parts.append(current.strip())
                        current = ""
                        continue
                    current += char
                if current.strip():
                    parts.append(current.strip())
                
                for part in parts:
                    try:
                        func_args.append(eval(part.strip()))
                    except:
                        pass
        else:
            # Single argument
            try:
                func_args = [eval(input_str)]
            except:
                pass
        
        
        # Capture stdout? For now just return value
        ret = ${functionName}(*func_args)
        
        # Normalize for comparison (simplified)
        actual = str(ret).replace(" ", "").replace("'", '"')
        expected = str(tc["output"]).replace(" ", "").replace("'", '"')
        
        status = "Passed" if actual == expected else "Failed"
        
        results.append({
            "id": tc["id"],
            "status": status,
            "input": tc["input"],
            "expected": tc["output"],
            "actual": str(ret),
            "isHidden": tc.get("isHidden", False)
        })
    except Exception as e:
        results.append({
            "id": tc["id"],
            "status": "Error",
            "input": tc["input"],
            "expected": tc["output"],
            "actual": str(e),
             "isHidden": tc.get("isHidden", False)
        })

print("TEST_RESULTS_START")
print(json.dumps(results))
print("TEST_RESULTS_END")
`;
          } else if (mode === "run-tests") {
            // Run only visible (non-hidden) test cases
            const visibleTestCases = (problem.testCases || []).filter(
              (tc: any) => !tc.isHidden,
            );
            const testCases = JSON.stringify(visibleTestCases)
              .replace(/true/g, "True")
              .replace(/false/g, "False");
            finalCode = `
import json
import sys
${code}

# Test Runner for visible test cases only
test_cases = ${testCases}
results = []
arg_names = ${jsonArgs}

for tc in test_cases:
    try:
        func_args = []
        input_str = tc["input"]
        
        # Try to parse comma-separated values
        # For inputs like "[2,7,11,15], 9", we need to split and evaluate each part
        if "," in input_str and len(arg_names) > 1:
            # Smart split by comma, accounting for nested structures
            import ast
            # Try to parse as tuple/list first
            try:
                # Wrap in parentheses to make it a valid tuple expression
                parsed = ast.literal_eval(f"({input_str})")
                if isinstance(parsed, tuple):
                    func_args = list(parsed)
                else:
                    func_args = [parsed]
            except:
                # Fallback: simple split and eval each part
                parts = []
                depth = 0
                current = ""
                for char in input_str:
                    if char in "[{(":
                        depth += 1
                    elif char in "]})":
                        depth -= 1
                    elif char == "," and depth == 0:
                        parts.append(current.strip())
                        current = ""
                        continue
                    current += char
                if current.strip():
                    parts.append(current.strip())
                
                for part in parts:
                    try:
                        func_args.append(eval(part.strip()))
                    except:
                        pass
        else:
            # Single argument or no commas
            try:
                func_args = [eval(input_str)]
            except:
                pass
        
        ret = ${functionName}(*func_args)
        
        actual = str(ret).replace(" ", "").replace("'", '"')
        expected = str(tc["output"]).replace(" ", "").replace("'", '"')
        
        status = "Passed" if actual == expected else "Failed"
        
        results.append({
            "id": tc["id"],
            "status": status,
            "input": tc["input"],
            "expected": tc["output"],
            "actual": str(ret),
            "isHidden": False
        })
    except Exception as e:
        results.append({
            "id": tc["id"],
            "status": "Error",
            "input": tc["input"],
            "expected": tc["output"],
            "actual": str(e),
            "isHidden": False
        })

print("TEST_RESULTS_START")
print(json.dumps(results))
print("TEST_RESULTS_END")
`;
          }
        } else if (language === "javascript") {
          // JS Implementation (Simplistic)
          // ... similar logic using eval/Function ...
          if (mode === "run") {
            finalCode = `${code}\n\n// Runner\n${runInput}\nconsole.log(${functionName}(${(args || []).join(",")}));`;
          } else if (mode === "submit") {
            // complex to inject JS runner string safely similar to python
            // For now, support Python fully first
          }
        }
      }
    }

    if (language === "python") {
      filename = `temp_${matchId}.py`;
      analyzerFilename = `analyze_${matchId}.py`;

      debugLogs.push(`Writing file to ${filename}`);
      await writeFilePromise(filename, finalCode);
      if (!isTestMode) {
        // Only analyze raw code, not wrapper
        await writeFilePromise(analyzerFilename, PYTHON_ANALYZER_SCRIPT);
        analysisCommand = `python ${analyzerFilename} ${filename}`;
      }

      // Check Python availability
      try {
        const { stdout: pyVer } = await execPromise("python --version", {
          timeout: 2000,
        });
        debugLogs.push(`Python version found: ${pyVer.trim()}`);
        command = `python ${filename}`;
      } catch (e) {
        debugLogs.push("Python command failed, trying 'py'...");
        try {
          const { stdout: pyVer2 } = await execPromise("py --version", {
            timeout: 2000,
          });
          debugLogs.push(`Py version found: ${pyVer2.trim()}`);
          command = `py ${filename}`;
        } catch (e2) {
          debugLogs.push("CRITICAL: Python not found in path.");
          throw new Error(
            "Python is not installed or not found in system PATH.",
          );
        }
      }
      debugLogs.push(`Execution command: ${command}`);
    } else if (language === "javascript") {
      filename = `temp_${matchId}.js`;
      await writeFilePromise(filename, finalCode);
      command = `node ${filename}`;
    } else if (language === "cpp") {
      filename = `temp_${matchId}.cpp`;
      const exeFile = `temp_${matchId}.exe`;

      await writeFilePromise(filename, finalCode);

      // Compile C++ code
      try {
        const { stderr: compileErr } = await execPromise(
          `g++ "${filename}" -o "${exeFile}" -std=c++17`,
          { timeout: 10000 },
        );

        if (compileErr && compileErr.includes("error:")) {
          // Cleanup
          if (fs.existsSync(filename)) await unlinkPromise(filename);
          return NextResponse.json({
            error: compileErr,
            parsedError: {
              type: "Compilation Error",
              message: compileErr,
              suggestion: "Check for syntax errors in your C++ code.",
            },
          });
        }
      } catch (e: any) {
        if (fs.existsSync(filename)) await unlinkPromise(filename);
        return NextResponse.json({
          error: e.stderr || e.message,
          parsedError: {
            type: "Compilation Error",
            message: e.stderr || e.message,
          },
        });
      }

      command = `./${exeFile}`;
    } else if (language === "java") {
      filename = `Solution.java`;
      const className = "Solution";

      await writeFilePromise(filename, finalCode);

      // Compile Java code
      try {
        const { stderr: compileErr } = await execPromise(
          `javac "${filename}"`,
          { timeout: 10000 },
        );

        if (compileErr && compileErr.includes("error:")) {
          // Cleanup
          if (fs.existsSync(filename)) await unlinkPromise(filename);
          return NextResponse.json({
            error: compileErr,
            parsedError: {
              type: "Compilation Error",
              message: compileErr,
              suggestion: "Check for syntax errors in your Java code.",
            },
          });
        }
      } catch (e: any) {
        if (fs.existsSync(filename)) await unlinkPromise(filename);
        return NextResponse.json({
          error: e.stderr || e.message,
          parsedError: {
            type: "Compilation Error",
            message: e.stderr || e.message,
          },
        });
      }

      command = `java ${className}`;
    } else if (language === "c") {
      filename = `temp_${matchId}.c`;
      const exeFile = `temp_${matchId}.exe`;

      await writeFilePromise(filename, finalCode);

      // Compile C code
      try {
        const { stderr: compileErr } = await execPromise(
          `gcc "${filename}" -o "${exeFile}"`,
          { timeout: 10000 },
        );

        if (compileErr && compileErr.includes("error:")) {
          // Cleanup
          if (fs.existsSync(filename)) await unlinkPromise(filename);
          return NextResponse.json({
            error: compileErr,
            parsedError: {
              type: "Compilation Error",
              message: compileErr,
              suggestion: "Check for syntax errors in your C code.",
            },
          });
        }
      } catch (e: any) {
        if (fs.existsSync(filename)) await unlinkPromise(filename);
        return NextResponse.json({
          error: e.stderr || e.message,
          parsedError: {
            type: "Compilation Error",
            message: e.stderr || e.message,
          },
        });
      }

      command = `./${exeFile}`;
    } else {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    // Execute the code
    const startTime = Date.now();
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    const runtime = Date.now() - startTime;

    // Execute analysis if command exists (Python only for now)
    if (analysisCommand) {
      try {
        const { stdout: analysisStdout } = await execPromise(analysisCommand, {
          timeout: 2000,
        });
        const analysisResult = JSON.parse(analysisStdout);
        symbolTable = analysisResult.symbolTable || {};
        astData = analysisResult.ast || null;
        tac = analysisResult.tac || [];
        optimizedTac = analysisResult.optimizedTac || [];
        optimizationLogs = analysisResult.optimizationLogs || [];
        typeErrors = analysisResult.typeErrors || [];
        tokens = analysisResult.tokens || [];
        assembly = analysisResult.assembly || [];
      } catch (e) {
        console.error("Analysis failed:", e);
      }
    }

    // Cleanup
    if (fs.existsSync(filename)) {
      await unlinkPromise(filename);
    }
    if (analyzerFilename && fs.existsSync(analyzerFilename)) {
      await unlinkPromise(analyzerFilename);
    }
    if (language === "cpp" || language === "c") {
      const exeFile = `temp_${matchId}.exe`;
      if (fs.existsSync(exeFile)) await unlinkPromise(exeFile);
    }
    if (language === "java") {
      if (fs.existsSync("Solution.class"))
        await unlinkPromise("Solution.class");
    }

    let parsedError = null;
    if (stderr) {
      if (language === "python") {
        parsedError = parsePythonError(stderr);
      } else if (language === "javascript") {
        parsedError = parseJavaScriptError(stderr);
      }
    }

    // Parse Test Results if mode=submit or run-tests
    if (
      (mode === "submit" || mode === "run-tests") &&
      stdout.includes("TEST_RESULTS_START")
    ) {
      const parts = stdout.split("TEST_RESULTS_START");
      const jsonPart = parts[1].split("TEST_RESULTS_END")[0].trim();
      try {
        testResults = JSON.parse(jsonPart);
        // Hide hidden tests actual/expected (only for submit mode)
        if (mode === "submit") {
          testResults = testResults.map((r: any) => {
            if (r.isHidden && r.status !== "Passed") {
              return { ...r, expected: "Hidden", actual: "Hidden" };
            }
            return r;
          });
        }
      } catch (e) {
        console.error("Failed to parse test results", e);
      }
    }

    return NextResponse.json({
      output: stdout,
      error: stderr,
      parsedError,
      symbolTable,
      ast: astData,
      tac,
      optimizedTac,
      optimizationLogs,
      typeErrors,
      tokens,
      assembly,
      testResults,
      runtime,
      debugLogs, // Return logs to frontend
    });
  } catch (error: any) {
    // Cleanup on error
    if (filename && fs.existsSync(filename)) {
      await unlinkPromise(filename).catch(() => { });
    }
    if (analyzerFilename && fs.existsSync(analyzerFilename)) {
      await unlinkPromise(analyzerFilename).catch(() => { });
    }
    if (language === "cpp" || language === "c") {
      const exeFile = `temp_${matchId}.exe`;
      if (fs.existsSync(exeFile)) await unlinkPromise(exeFile).catch(() => { });
    }
    if (language === "java") {
      if (fs.existsSync("Solution.class"))
        await unlinkPromise("Solution.class").catch(() => { });
    }

    const output = error.stdout || "";
    const errOutput = error.stderr || error.message;

    let parsedError = null;
    if (language === "python") {
      parsedError = parsePythonError(errOutput);
    } else if (language === "javascript") {
      parsedError = parseJavaScriptError(errOutput);
    }

    return NextResponse.json({
      output: output,
      error: errOutput,
      parsedError,
      debugLogs,
    });
  }
}
