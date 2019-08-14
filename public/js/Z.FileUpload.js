/*
 * Desc : html5 文件上传，图片预览(base64)  XMLHttpRequest2.0
 * Author : email@404.life
 * 
 * 
 *  参数：
 * 	 uploadUrl 文件上传url	
 * 	 token 七牛上传必须加上token
 * 	 filter 文件过滤方式外部定义
 * 	 selected 选中文件时执行
 *   preview  预览回调 接收filesArr参数
 * 
 * */

var FileUpload = function(obj) {
	this.filesArr = [];
	this.uploadUrl = obj.uploadUrl;
	this.token = obj.token || '';
	this.onFailure = obj.onFailure;
	this.onProgress = obj.onProgress;
	this.onSucess = obj.onSucess;
	this.onDelFile = obj.onDelFile;
	this.noFile = obj.noFile;
	this.fileSelected = function(files) {
		this.filesArr = this.filesArr.concat(obj.filter(files));
		for (var i = 0; i < this.filesArr.length; i++) {
			this.filesArr[i].index = i;
		}		
		obj.preview(this.filesArr);
	};
	
	this.sendFile = function() {
		var arr = this.filesArr,
			len = arr.length;
		if (len < 1) {
			return alert('没有文件');
		}
		for (var i = 0; i < arr.length; i++) {
			this.startUpload(arr[i]);
		}		
	};
	
	this.delFile = function(index) {
		var i = 0,
			len = this.filesArr.length;
		for (; i < len; i++) {
			if(this.filesArr[i].index == index) {
				this.filesArr.splice(i,1);
				this.onDelFile(index);
				if(this.filesArr.length === 0) {
					this.noFile();
				}
				return;
			}
		}	
		
	};
	
	//formData.append('upload', file);本地*	formData.append('x:filename', 'test'); 自定义文件名需后端有saveKey
	this.startUpload = function(file) {
		var self = this,
			formData = new FormData(),
			fileName = '[' + file.name + '] ',
			xhr = new XMLHttpRequest();
			
		formData.append('token', this.token);
		formData.append('file', file);
		xhr.upload.addEventListener('progress',
			function uploadProgress(evt) {
				/* evt 有三个属性：
				 lengthComputable – 可计算的已上传字节数
				 total – 总的字节数
				 loaded – 到目前为止上传的字节数
				*/
				if (evt.lengthComputable) {
					var percent = Math.round((evt.loaded / evt.total) * 100) + '%';
					self.onProgress(file.index,percent);
				}
			}, false);
/*	
		xhr.upload.onload = function() {
			console.log(fileName + '链接已经建立'+' xhr.readyState:'+xhr.readyState+'  xhr.status:' + xhr.status, '  xhr.response:' + xhr.response);
		};
	*/
		xhr.onreadystatechange = function(e) {
			if (xhr.readyState == 4) {
				if(xhr.status == 200){
					self.onSucess(file,xhr.response);
					self.delFile(file.index);
				}else {
					self.onFailure(file,xhr.response);
				}
			}/* else {
				console.log('xhr.readyState:'+xhr.readyState+'  xhr.status:' + xhr.status, '  xhr.response:' + xhr.response);
			}*/
		};
	
		xhr.upload.onerror = function(e) {
			console.log(fileName + '：上传出错\r\n readyState：'+xhr.readyState+'\r\nxhr.response：'+xhr.response);
		};
	
		xhr.open('post', this.uploadUrl, true);
		xhr.send(formData);
	};
};

