<template>
  <div class="main">
		
			
			<div class="grid-content bg-purple-dark "></div>
					    <h1>
								上传图片批量裁剪并下载
							</h1>
					    <div>
					        <!-- element 上传图片按钮 -->
					      <el-upload class="upload-demo" action="" drag 
					:auto-upload="false" :show-file-list="true" :multiple="true" list-type="picture" :file-list="fileList" :on-change='changeUpload' :on-preview="handlePreview"> 
					        <i class="el-icon-upload"></i>
					        <div class="el-upload__text">点击上传</div>
					        <div class="el-upload__tip">支持绝大多数图片格式，单张图片最大支持10MB</div>
					      </el-upload>
					    </div>
							
							 <!-- vueCropper 剪裁图片实现-->
					    <el-dialog title="图片剪裁" :visible.sync="dialogVisible" :fullscreen="false"   width="80%" center append-to-body>
					      <div class="cropper-content">
					        <div class="cropper" style="text-align:center;min-height: 600px;">
					        <vueCropper
					            ref="cropper"
					            :img="option.img"
					            :outputSize="option.outputSize"
					            :outputType="option.outputType"
					            :info="option.info"
					            :full="option.full"
					            :canMove="option.canMove"
					            :canMoveBox="option.canMoveBox"
					            :original="option.original"
					            :autoCrop="option.autoCrop"
					            :fixed="option.fixed"
					            :fixedNumber="option.fixedNumber"
					            :centerBox="option.centerBox"
					            :infoTrue="option.infoTrue"
					            :fixedBox="option.fixedBox"
					            @realTime="realTime"
					          ></vueCropper>
					        </div>
					      </div>
					      <div slot="footer" class="dialog-footer">
					        <el-button @click="dialogVisible = false">取 消</el-button>
					        <el-button type="primary" @click="finish" >确认并下载</el-button>
					      </div>
					    </el-dialog>
							<a :href="downImg" :download="currentFileName" ref="downloadDom"></a>
							

		
  </div>
</template>

<script>

export default {
  data() {
    return {
      dialogVisible: false,
      // 裁剪组件的基础配置option
			currentFileName : '下载图片.jpg',
			downImg : '#',
      option: {
        img: '', // 裁剪图片的地址
        info: true, // 裁剪框的大小信息
        outputSize: 1, // 裁剪生成图片的质量
        outputType: 'jpeg', // 裁剪生成图片的格式
        canScale: false, // 图片是否允许滚轮缩放
        autoCrop: true, // 是否默认生成截图框
        // autoCropWidth: 300, // 默认生成截图框宽度
        // autoCropHeight: 200, // 默认生成截图框高度
        fixedBox: false, // 固定截图框大小 不允许改变
        fixed: false, // 是否开启截图框宽高固定比例
        fixedNumber: [7, 5], // 截图框的宽高比例
        full: true, // 是否输出原图比例的截图
				canMove : true,
        canMoveBox: true, // 截图框能否拖动
        original: true, // 上传图片按照原始比例渲染
        centerBox: true, // 截图框是否被限制在图片里面
        infoTrue: true // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
      },
      fileList: [],  //页面显示的数组
    }
  },
  methods: {
		handlePreview(file) {
			this.currentFileName = file.name;
			this.option.img = file.url
			this.dialogVisible = true
		},
		realTime(data) {
				console.log('realTime',data);
		},
		down(type='blob') {
      // event.preventDefault()
      // 输出
      if (type === "blob") {
        this.$refs.cropper.getCropBlob(data => {
          this.downImg = window.URL.createObjectURL(data);
					debugger
          if (window.navigator.msSaveBlob) {
            var blobObject = new Blob([data]);
            window.navigator.msSaveBlob(blobObject, "demo.png");
          } else {
            this.$nextTick(() => {
              this.$refs.downloadDom.click();
            });
          }
        });
      } else {
        this.$refs.cropper.getCropData(data => {
          this.downImg = data;
          if (window.navigator.msSaveBlob) {
            var blobObject = new Blob([data]);
            window.navigator.msSaveBlob(blobObject, "demo.png");
          } else {
            this.$nextTick(() => {
              this.$refs.downloadDom.click();
            });
          }
        });
      }
    },
    // 上传按钮   限制图片大小
    changeUpload(file, fileList) {
      const isLt5M = file.size / 1024 / 1024 < 10
      if (!isLt5M) {
        this.$message.error('上传文件大小不能超过 10MB!')
        return false
      }
      this.fileinfo = file
    },
    // 点击裁剪，这一步是可以拿到处理后的地址
		
    finish() {
      this.down();
    }
		
  }
}
</script>

<style >
.main {
	text-align: center;
}
.con {
	margin: 0 auto;
}
.cropper-content {
    
}
.cropper {
			width: auto;
			height: 300px;
	}
	.upload-demo {
		width: 50%;
    margin: 0 auto;
	}
</style>
