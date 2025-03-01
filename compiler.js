document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("runButton").addEventListener("click", runEsperantoCode);
});

const keywords = new Set(["estas", "plus", "minus", "oble", "dividita", "montru", "dum", "se"]);
const operators = { "plus": "+", "minus": "-", "oble": "*", "dividita": "/" };

function lexer(code) {
    const tokens = [];
    const words = code.match(/\w+|\S/g);  // Boşluk bazlı yerine karakter bazlı bölme

    words.forEach(word => {
        if (!isNaN(word)) {
            tokens.push(["NUMBER", Number(word)]);
        } else if (keywords.has(word)) {
            tokens.push([word.toUpperCase(), word]);
        } else if (operators[word]) {
            tokens.push(["OPERATOR", operators[word]]);
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)) {
            tokens.push(["IDENTIFIER", word]);
        } else if (word === "(" || word === ")") {
            tokens.push(["PAREN", word]);
        } else {
            tokens.push(["ERROR", word]);
        }
    });

    return tokens;
}

function parser(tokens) {
    const ast = [];
    let i = 0;

    while (i < tokens.length) {
        const [type, value] = tokens[i];

        if (type === "IDENTIFIER" && i + 2 < tokens.length && tokens[i + 1][0] === "ESTAS") {
            let expressionTokens = tokens.slice(i + 2);
            let expressionTree = parseExpression(expressionTokens);
            ast.push(["ASSIGN", value, expressionTree]);
            i += 2 + expressionTokens.length;
        } else if (type === "MONTRU" && i + 1 < tokens.length) {
            let expressionTokens = tokens.slice(i + 1);
            let expressionTree = parseExpression(expressionTokens);
            ast.push(["PRINT", expressionTree]);
            i += 1 + expressionTokens.length;
        } else {
            i++;
        }
    }

    return ast;
}

function parseExpression(tokens) {
    let outputQueue = [];
    let operatorStack = [];

    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };

    tokens.forEach(([type, value]) => {
        if (type === "NUMBER" || type === "IDENTIFIER") {
            outputQueue.push([type, value]);
        } else if (type === "OPERATOR") {
            while (
                operatorStack.length > 0 &&
                precedence[operatorStack[operatorStack.length - 1][1]] >= precedence[value]
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push([type, value]);
        } else if (value === "(") {
            operatorStack.push([type, value]);
        } else if (value === ")") {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1][1] !== "(") {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // Remove "("
        }
    });

    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
}

function interpreter(ast) {
    const variables = {};
    let output = "";

    function evaluate(expression) {
        let stack = [];

        expression.forEach(token => {
            let [type, value] = token;
            if (type === "NUMBER") {
                stack.push(value);
            } else if (type === "IDENTIFIER") {
                stack.push(variables[value] || 0);
            } else if (type === "OPERATOR") {
                let b = stack.pop();
                let a = stack.pop();
                if (value === "+") stack.push(a + b);
                if (value === "-") stack.push(a - b);
                if (value === "*") stack.push(a * b);
                if (value === "/") stack.push(a / b);
            }
        });

        return stack.pop();
    }

    ast.forEach(node => {
        if (node[0] === "ASSIGN") {
            variables[node[1]] = evaluate(node[2]);
        } else if (node[0] === "PRINT") {
            output += evaluate(node[1]) + "\n";
        }
    });

    document.getElementById("esperantoOutput").innerText = output;
}

function runEsperantoCode() {
    const codeElement = document.getElementById("editor");
    const code = codeElement.innerText.trim();

    if (code === "") {
        document.getElementById("esperantoOutput").innerText = "Neniu kodo enmetita!";
        return;
    }

    const tokens = lexer(code);
    const ast = parser(tokens);
    interpreter(ast);
}
