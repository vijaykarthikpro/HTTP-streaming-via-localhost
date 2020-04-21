const {createServer} = require('http');
const {stat,createReadStream,createWriteStream} = require('fs');
const {promisify} = require('util');
const fileName = './wolverine-logan-fight-scene.mp4';
const fileInfo = promisify(stat);
const multiparty = require('multiparty');

const respondWithVideo = async (req,res)=>{

    const {size}= await fileInfo(fileName);
    const range = req.headers.range;
    console.log("range: ",range);

    if(range){
        let [start, end]= range.replace(/bytes=/,"").split("-");
        start = parseInt(start, 10);
        end = end ? parseInt(end, 10) : size - 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start} - ${end}/${size}`,
            'Accept-Range':'bytes',
            'Content-Length': (end-start)+1,
            'Content-Type':'video/mp4'
        })
        createReadStream(fileName,{start, end}).pipe(res);

    }else{
        res.writeHead(200,{ 
            'Content-Type':'video/mp4',
            'Content-Length':size
        });
        createReadStream(fileName).pipe(res);
    }

}


createServer((req,res)=>{
    if(req.method === 'POST'){
        let form = new multiparty.Form();
        form.on('part', (part) =>{
            part.pipe(createWriteStream(`./${part.filename}`))
            .on('close',() =>{
                res.writeHead(200,{ 'Content-Type': 'text/html' });
                res.end(`<h1>File uploaded: ${part.filename}</h1>`);
            })

        })
        form.parse(req);
    }else if(req.url === '/video'){
        respondWithVideo(req,res);
    } else {
        res.writeHead(200, { 'Content-Type':'text/html '});
        res.end(`
        <form enctype="multipart/form-data" method="POST" action="/">
            <input type="file" name="Upload file"/>
            <button>Upload file</button>
        </form>
        `);
    }
}).listen(3000,()=> console.log("server running in port 3000"));
