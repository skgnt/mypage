class ram_compiler {
    constructor(code,{cmf=(memory)=>{
        console.log(memory)
    },omf=(idx,content)=>{
        new Error(`Error: ${idx} ${content}`)
    }}) 
    {
        this.code = code.split("\n");
        this.memory = [];
        this.labels = {};
        this.cmf = cmf;
        this.omf = omf;
    }
    memoryCTR(idx, value) {
        this.memory[idx] = value;
        this.cmf(this.memory);
    }
    memoryGET(idx) {
        //undefinedの場合はエラー
        let value = this.memory[idx];
        if (value === undefined) {
            this.omf(idx, "undefined");
        }
        return value;
    }

}