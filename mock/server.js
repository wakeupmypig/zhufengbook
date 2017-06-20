let http = require('http');
let url = require('url');
let slider = require('./slider');
let mime = require('mime');
let fs = require('fs');
function readBook(callback) {
  fs.readFile('./data.json','utf8',function (err,data) {
    data = data.length===''?[]:JSON.parse(data);
    callback(data);
  })
}
function writeBook(data,callback) {
  fs.writeFile('./data.json',JSON.stringify(data),callback);
}
http.createServer(function (req,res) {

  let {pathname,query}  =url.parse(req.url,true);
  let id = query.id;
  if(pathname === '/'){
    return fs.createReadStream('../dist/index.html').pipe(res)
  }
  if(pathname === '/api/slider'){
    return res.end(JSON.stringify(slider));
  }
  if(pathname === '/api/hot'){
    readBook(function (data) {
      data = data.reverse().slice(0,6);
      setTimeout(function () {
        res.end(JSON.stringify(data));
      },1000)
    });
    return
  }
  if(pathname === '/api/book'){
    switch(req.method){
      case 'GET':
        if(id){
          readBook(function (data) {
            var obj = data.find(item=>item.id == id);
            res.end(JSON.stringify(obj));
          });
        }else{
            readBook(function (data) {
             setTimeout(function () {
               res.end(JSON.stringify(data));
             },1000)
            });
        }
        break;
      case 'POST':
        var str = '';
        req.on('data',function (data) {
          str+=data;
        })
        req.on('end',function () {

          readBook(function (data) {
            var book = JSON.parse(str);
            book.id = data.length>0?data[data.length-1].id+1:1;
            data.push(book)
              writeBook(data,function () {
              res.end(JSON.stringify(data))
            })
          });
        })

        break;
      case 'PUT':
        var str = '';
        req.on('data',function (data) {
          str+=data;
        })
        req.on('end',function () {
          readBook(function (data) {
            var book = JSON.parse(str);
            data = data.map(item=>{
              if(item.id == id){
                return book
              }else {
                return item
              }
            })
            writeBook(data,function () {
              res.end(JSON.stringify(data))
            })
          });
        })
        break;
      case 'DELETE':
        readBook(function (data) {
          data = data.filter((item)=>item.id != id);
          writeBook(data,function () {
            res.end(JSON.stringify({}))
          })
        });
        break;
    }
    return
  }
  fs.exists('../dist'+pathname,function (flag) {
    if(flag){
      res.setHeader('Content-Type',mime.lookup(pathname)+';charset=utf-8');
      fs.createReadStream('../dist'+pathname).pipe(res);
    }else{
      res.statusCode = 404;
      res.end('NOT FOUND');
    }
  })
}).listen(3000);
