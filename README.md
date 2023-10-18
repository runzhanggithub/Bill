项目说明：
Bill是一个演示项目，采用前后端分离架构。
Bill-Front是前端代码，前端采用vite+vue+typescript技术栈。
Bill-Back是后端代码，后端采用flask+mysql+redis技术栈。

启动：

Bill-Back
```
需准备python3.8.0环境；mysql3.7.35环境；redis环境；
数据库初始化需进入mysql管理平台，创建bill数据库，选择该数据库，
执行init_table_0_0.sql 表初始化语句；
cd Bill-Back 进入后端项目后
执行pip3 install -r requirement.txt 安装项目所需要的第三方包环境，可能还需要其他包，启动后按提示可以手动安装；
在config/config中配置所需要的redis和mysql地址；

在控制台执行，python3 runserver.py,后端项目就启动了

```

Bill-Front
```
先准备node和npm环境，node版本需大于16。
cd Bill-Front进入项目后，
执行npm i 命令，安装node_modules包;
然后npm run start 运行前端项目；
vite.config.ts中需配置连接后端的服务地址，默认是本地后端地址；

```