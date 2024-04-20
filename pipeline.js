var ram_class;

function ram_setting() {
    memory_show=document.getElementById('memory_show').checked;
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
    ram_class.run();
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