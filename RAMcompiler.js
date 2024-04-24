// MIT License

// Copyright (c) shinn

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
class RAMCompiler {
    constructor(code, { cmf = (memory) => {
        console.log(memory)
    }, error = (idx, content) => {
        console.log(`Error at line ${idx}: ${content}`)
    }, show = (content) => {
        console.log(content)
    }
    }) {
        this.code = code.split("\n");
        this.memory = [];
        this.labels = {};
        this.finish_flg = false;
        this.error_flg = false;

        this.cmf = cmf;
        this.error = (idx, content) => {
            error(idx + 1, content);
            this.error_flg = true;
            throw new Error(`Error at line ${idx + 1}: ${content}`);
        }
        this.show = show;
        this.code_step = 0;
        //codeを一行ずつ読み込み、ラベルを記録して、codeからラベルを削除
        for (let i = 0; i < this.code.length; i++) {
            let code_one = this.code[i];
            //\r\nを削除
            code_one = code_one.replace(/\r/, "");
            code_one = code_one.replace(/^\s+/, "");
            code_one = code_one.replace(/;.*/, "");
            //code_oneに:があるかどうか
            let idx = code_one.indexOf(":");
            if (idx != -1) {
                let [label, ...command] = code_one.split(":");
                //labelに空白やタブがある場合はエラー
                if (label.indexOf(" ") != -1 || label.indexOf("\t") != -1) {
                    this.error(i, `Label ${label} is invalid`);
                }
                this.labels[label] = i;

                code_one = command.join(" ");
            }
            this.code[i] = code_one;
        }
        this.show("RAM compiler is ready")


    }
    memorySET(idx, value) {
        this.memory[idx] = value;
        this.cmf(this.memory);
    }
    memoryGET(idx) {
        //undefinedの場合はエラー
        let value = this.memory[idx];
        if (value === undefined) {
            this.error(this.code_step, `Memory ${idx} is not defined`)
        }
        return value;
    }

    analyzeOperand(operand) {
        //オペランドの種類は
        // numのみアドレスの数値を指定
        // *numの場合はそのアドレスの値の数値を指定
        // =numの場合numを指定
        let type = operand[0];
        switch (type) {
            case "*":
                //一文字目を削除して、再帰的に処理
                return this.analyzeOperand(this.memoryGET(parseInt(operand.slice(1))));
            case "=":
                return parseInt(operand.slice(1));
            default:
                return this.memoryGET(parseInt(operand));
        }
    }
    analyzeOperandAddress(operand) {
        //オペランドの種類は
        // numのみアドレスの数値を指定
        // *numの場合はそのアドレスの値の数値を指定
        // =numの場合numを指定
        let type = operand[0];
        switch (type) {
            case "*":
                //一文字目を削除して、再帰的に処理
                return this.analyzeOperandAddress(this.memoryGET(parseInt(operand.slice(1))));
            case "=":
                //エラー生成
                this.error(this.code_step, "Invalid address")
            default:
                return parseInt(operand);
        }
    }


    interactive() {
        if (this.finish_flg) {
            this.error(this.code_step, "Code is already finished");
            return;
        }
        //code_stepがcodeの長さ以上の場合はエラー
        if (this.code_step >= this.code.length) {
            this.error(this.code_step, "EOF is reached. Did you forget to execute HALT?");
            return;
        }
        let code_one = this.code[this.code_step];
        code_one = code_one.replace(/^\s+/, "");

        //";"以降はコメントとして無視
        code_one = code_one.replace(/;.*/, "");
        //code_oneの末尾の空白を削除
        code_one = code_one.replace(/\s+$/, "");
        let [command, ...args] = code_one.split(" ");
        args = args.join("").split(",")

        switch (command) {
            // LOAD：r0にデータをコピーする(e.g. LOAD 1)
            // STORE：r0の内容を別の場所にコピーする (e.g. STORE 1)
            // ADD：r0 ← r0 + 別のメモリ (e.g. ADD =10)
            // SUB：r0 ← r0 - 別のメモリ (e.g. SUB 1)
            // MULT：r0 ← r0 × 別のメモリ (e.g. MULT 1)
            // DIV：r0 ← r0 / 別のメモリ (e.g. DIV 10)
            // JUMP: 与えられたラベルにジャンプ (e.g. JUMP label)
            // JZERO: r0 = 0 ならば 与えられたラベルにジャンプ (e.g. JZERO label)
            // JGTZ: r0 > 0 ならば 与えられたラベルにジャンプ (e.g. JGTZ label)
            // READ: テープからメモリへ読み込む (e.g. READ)
            // WRITE: メモリからテープ（画面）に書き出す (e.g. WRITE 0)
            // HALT: 停止する(e.g. HALT)
            //アドレスのアクセス方法
            //*num: num番地の値のアドレスを指定
            //num: num番地を指定
            //=num: numを直接指定
            //ラベルはlabel:の形式で指定
            case "LOAD":
                //argsが2つ以上ある場合はエラー
                if (args.length != 1) {
                    this.error(this.code_step, "LOAD command requires 1 argument(e.g. LOAD 0)");
                }
                this.memorySET(0, this.analyzeOperand(args[0]));
                this.code_step++;
                break;
            case "STORE":
                //一つの引数をとり、そのアドレスに0番地の値を格納する
                if (args.length != 1) {
                    this.error(this.code_step, "STORE command requires 1 argument(e.g. STORE 1)");
                }
                this.memorySET(this.analyzeOperandAddress(args[0]), this.memoryGET(0));
                this.code_step++;
                break;
            case "ADD":
                //ひとつの引数をとり、そのアドレスの値を0番地の値に加算して、0番地に格納する
                if (args.length != 1) {
                    this.error(this.code_step, "ADD command requires 1 argument(e.g. ADD 1)");
                }
                this.memorySET(0, this.memoryGET(0) + this.analyzeOperand(args[0]));
                this.code_step++;
                break;
            case "SUB":
                //ひとつの引数をとり、そのアドレスの値を0番地の値から減算して、0番地に格納する
                if (args.length != 1) {
                    this.error(this.code_step, "SUB command requires 1 argument(e.g. SUB 1)");
                }
                this.memorySET(0, this.memoryGET(0) - this.analyzeOperand(args[0]));
                this.code_step++;
                break;
            case "MULT":
                //ひとつの引数をとり、そのアドレスの値を0番地の値に乗算して、0番地に格納する
                if (args.length != 1) {
                    this.error(this.code_step, "MULT command requires 1 argument(e.g. MULT 1)");
                }
                this.memorySET(0, this.memoryGET(0) * this.analyzeOperand(args[0]));
                this.code_step++;
                break;
            case "DIV":
                //ひとつの引数をとり、そのアドレスの値を0番地の値で除算して、0番地に格納する
                if (args.length != 1) {
                    this.error(this.code_step, "DIV command requires 1 argument(e.g. DIV 1)");
                }
                //整数の除算
                this.memorySET(0, Math.floor(this.memoryGET(0) / this.analyzeOperand(args[0])));
                this.code_step++;
                break;
            case "JUMP":
                //ひとつの引数をとり、そのラベルにジャンプする
                if (args.length != 1) {
                    this.error(this.code_step, "JUMP command requires 1 argument(e.g. JUMP label)");
                }
                //this.labelsにラベルがない場合はエラー
                if (this.labels[args[0]] === undefined) {
                    this.error(this.code_step, `Label ${args[0]} is not found`);
                }
                this.code_step = this.labels[args[0]];
                break;
            case "JZERO":
                //ひとつの引数をとり、0番地の値が0ならば、そのラベルにジャンプする
                if (args.length != 1) {
                    this.error(this.code_step, "JZERO command requires 1 argument(e.g. JZERO label)");
                }
                if (this.memoryGET(0) == 0) {
                    //this.labelsにラベルがない場合はエラー
                    if (this.labels[args[0]] === undefined) {
                        this.error(this.code_step, `Label ${args[0]} is not found`);
                    }
                    this.code_step = this.labels[args[0]];
                }
                else {
                    this.code_step++;
                }
                break;
            case "JGTZ":
                //ひとつの引数をとり、0番地の値が正ならば、そのラベルにジャンプする
                if (args.length != 1) {
                    this.error(this.code_step, "JGTZ command requires 1 argument(e.g. JGTZ label)");
                }
                if (this.memoryGET(0) > 0) {
                    //this.labelsにラベルがない場合はエラー
                    if (this.labels[args[0]] === undefined) {
                        this.error(this.code_step, `Label ${args[0]} is not found`);
                    }
                    this.code_step = this.labels[args[0]];
                }
                else {
                    this.code_step++;
                }
                break;
            case "SJ":
                //三つの引数をとり、X-YをXへ代入して，Xが0であればラベルZへJUMPする。
                if (args.length != 3) {
                    this.error(this.code_step, "SJ command requires 3 arguments(e.g. SJ X,Y,Z)");
                }

                let [X, Y, Z] = args;
                //XとYが同じならX番地に0を代入
                if (X == Y) {
                    this.memorySET(this.analyzeOperandAddress(X), 0);
                }
                else {
                    this.memorySET(this.analyzeOperandAddress(X), this.analyzeOperand(X) - this.analyzeOperand(Y));
                }
    
                if (this.memoryGET(this.analyzeOperandAddress(X)) == 0) {
                    //this.labelsにラベルがない場合はエラー
                    if (this.labels[Z] === undefined) {
                        this.error(this.code_step, `Label ${Z} is not found`);
                    }
                    this.code_step = this.labels[Z];
                }
                else {
                    this.code_step++;
                }
                break;
            case "READ":
                //引数をとらない。テープからメモリへ読み込む
                this.memorySET(0, parseInt(prompt("Input number")));
                this.code_step++;
                break;
            case "WRITE":
                //引数をとらない。メモリからテープ（画面）に書き出す
                this.show(this.analyzeOperand(args[0]));
                this.code_step++;
                break;
            case "HALT":
                //引数をとらない。停止する
                this.finish_flg = true;
                this.show("Run successfully");
                this.show("--------------------");
                return;
            default:
                if (command == "") {
                    this.code_step++;
                    return;
                }
                else {
                    this.error(this.code_step, `Command ${command} is not found`);
                }
        }
    }

    run() {
        while (!this.finish_flg && !this.error_flg) {
            this.interactive();
        }
    }


}