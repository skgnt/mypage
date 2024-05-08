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
var ram_class;


var stop_flg = false;

var t=10
var interval

//クエリを解析して、t=numで指定された場合はtを変更
var searchParams = new URLSearchParams(window.location.search)
if(searchParams.has('t')){
    t = searchParams.get('t');
}



function ram_setting() {
    memory_show=document.getElementById('memory_show').checked;
    record_data()
    ram_class = new RAMCompiler(model.getValue(), {
        cmf: (memory) => {
            if (memory_show) {

                let memory_table = document.getElementById('memory_table');
                memory_table.innerHTML = "";
                for (let i = 0; i < memory.length; i++) {
                    //templateのmemory_caseをクローン
                    let memory_case = document.getElementById('memory_case');
                    let memory_case_clone = memory_case.content.cloneNode(true);
                    //クローンしたmaに値を代入
                    memory_case_clone.querySelector('.ma').innerText = "r" + i;
                    memory_case_clone.querySelector('.md').innerText = memory[i];
                    memory_table.appendChild(memory_case_clone);
                }
            }

        }, error: (idx, content) => {
            //htmlのコンソールに赤色で表示
            let console = document.getElementById('console');
            console.innerHTML += `<p style="color:red;">Error at line ${idx}: ${content}</p>`;
            let consoleElement = document.getElementById('console');
            consoleElement.scrollTop = consoleElement.scrollHeight;

        }, show: (content) => {
            //htmlのコンソールに表示
            let console_ele = document.getElementById('console');
            console_ele.innerHTML += `<p>${content}</p>`;
            let consoleElement = document.getElementById('console');
            consoleElement.scrollTop = consoleElement.scrollHeight;
        }
    });

}
function ram_run() {
    if(ram_class==null){
        alert("Please initialize ram");
    }
    stop_flg = false;
    if(t==0){
        ram_class.run();
    }
    else{
        ram_run_step();
    }

}
function ram_run_step(){
    if(!ram_class.finish_flg && !ram_class.error_flg){
        
        //ctrl+cで止める
        if(stop_flg){
            ram_class.error_flg=true;
            stop_flg=false;
            let console = document.getElementById('console');
            console.innerHTML += `<p style="color:red;">Error: at line ${ram_class.code_step}: KeyboardInterrupt</p>`;
            let consoleElement = document.getElementById('console');
            consoleElement.scrollTop = consoleElement.scrollHeight;
            
        }
        if(ram_class.code_step>10000){
            ram_class.error("Infinite loop");
        }
        ram_interactive();
        //10msごとにram_run_stepを呼び出す
        setTimeout(ram_run_step, t);
    }

}

function ram_interactive() {

    if(ram_class==null){
        alert("Please initialize ram");
    }
    
    if (decorations != null) {
        decorations.clear();
    }



    // var decorations = model.createDecorationsCollection([が定義してあるのでcode_stepと同期する 
    decorations = model.createDecorationsCollection([
        {
            range: new monaco.Range(ram_class.code_step + 1, 1, ram_class.code_step + 1, 1),
            options: {
                glyphMarginClassName: "myGlyphMarginClass",
            },
        },
    ]);
    ram_class.interactive();
}

document.addEventListener('keydown', function (e) {
    //ctrl+cで止める
    if (e.ctrlKey && e.key === 'c') {
        stop_flg = true;
    }
}
);