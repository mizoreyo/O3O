import { setUser, getUser } from "./storage-util";

export default class O3O {
  options = {
    key: "mizore",
    api: "http://localhost:8080",
    pageId: null,
    o3oNode: null
  };

  commentInfo = {
    parentId: 0,
    comment: "",
    wordCount: 0
  };

  userInfo = {
    name: "",
    email: "",
    site: ""
  };

  constructor(options) {
    // 配置覆盖
    for (let key in options) {
      if (options[key] != null) {
        this.options[key] = options[key];
      }
    }
    console.log("o3oNode: ", this.options.o3oNode);
    // 事件绑定
    this.bindEvent();
    // 绑定数据及回显
    this.bindData();
    this.echoUserInfo();
    // 获取所有评论
    this.getComments();
  }

  //事件绑定
  bindEvent = () => {
    this.options.o3oNode.getElementsByClassName("at-user")[0].onclick = this.resetReplyTo;
    this.options.o3oNode.getElementsByClassName("c-b-submit")[0].onclick = this.comment;
    this.options.o3oNode.getElementsByClassName("ci-nickname")[0].onfocus = event => {
      this.inputReset(event, "name");
    };
    this.options.o3oNode.getElementsByClassName("ci-email")[0].onfocus = event => {
      this.inputReset(event, "email");
    };
    this.options.o3oNode.getElementsByClassName("ci-site")[0].onfocus = event => {
      this.inputReset(event, "site");
    };
    this.options.o3oNode.getElementsByClassName("c-area")[0].onfocus = event => {
      this.inputReset(event, "comment");
    };
  };

  // 数据单向绑定
  bindData = () => {
    this.options.o3oNode.getElementsByClassName("ci-nickname")[0].oninput = event => {
      console.log("昵称变动");
      this.userInfo.name = event.target.value.trim();
      setUser(this.options.key, this.userInfo);
    };
    this.options.o3oNode.getElementsByClassName("ci-email")[0].oninput = event => {
      console.log("邮箱变动");
      this.userInfo.email = event.target.value.trim();
      setUser(this.options.key, this.userInfo);
    };
    this.options.o3oNode.getElementsByClassName("ci-site")[0].oninput = event => {
      console.log("网址变动");
      this.userInfo.site = event.target.value.trim();
      setUser(this.options.key, this.userInfo);
    };
    this.options.o3oNode.getElementsByClassName("c-area")[0].oninput = event => {
      console.log("评论变动");
      const comment = event.target.value.trim();
      this.commentInfo.comment = comment;
      this.commentInfo.wordCount = comment.length;
      this.wordCountCheck();
    };
  };

  // 从localStorage回显用户信息
  echoUserInfo = () => {
    const storageUser = getUser(this.options.key);
    if (storageUser != null) {
      for (let key in this.userInfo) {
        if (storageUser.hasOwnProperty(key) && storageUser[key] !== null && storageUser[key] !== undefined) {
          this.userInfo[key] = storageUser[key].trim();
        }
      }
    }
    console.log("用户信息: ", this.userInfo);
    this.options.o3oNode.getElementsByClassName("ci-nickname")[0].value = this.userInfo.name;
    this.options.o3oNode.getElementsByClassName("ci-email")[0].value = this.userInfo.email;
    this.options.o3oNode.getElementsByClassName("ci-site")[0].value = this.userInfo.site;
  };

  // 重置回复人回调（设为回复博主）
  resetReplyTo = () => {
    this.commentInfo.parentId = 0;
    this.options.o3oNode.getElementsByClassName("at-user")[0].innerText = "@";
  };

  // 发送评论
  comment = () => {
    // 检查参数合法性
    const nr = this.nickNameCheck();
    const er = this.emailCheck();
    const sr = this.siteCheck();
    const cr = this.commentCheck();
    if ((nr && er && sr && cr) === false) {
      console.log("校验错误,不可提交");
      return;
    } else {
      console.log("可提交");
      let commentBody = {
        key: this.options.key,
        pageId: this.options.pageId,
        parentId: this.commentInfo.parentId,
        name: this.userInfo.name,
        email: this.userInfo.email,
        site: this.userInfo.site,
        comment: this.commentInfo.comment
      };
      fetch(`${this.options.api}/comment`, {
        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(commentBody)
      })
        .then(response => response.json())
        .then(json => {
          console.log("提交评论结果:", json);
          this.getComments();
          // 将评论置空，防止刷屏
          this.options.o3oNode.getElementsByClassName("c-area")[0].value = "";
          this.commentInfo.comment = "";
        })
        .catch(error => {
          console.error(error);
        });
    }
  };

  // 获取所有评论
  getComments = () => {
    fetch(`${this.options.api}/comment?key=${this.options.key}&pageId=${this.options.pageId}`)
      .then(response => response.json())
      .then(json => {
        console.log("获取评论:", json);
        this.treeToDom(json.data);
      })
      .catch(error => {
        console.error(error);
      });
  };

  // 将评论树渲染到dom
  treeToDom = comments => {
    // 将评论列表置空
    this.options.o3oNode.getElementsByClassName("o-c-list")[0].innerHTML = "";
    // 首先渲染回复博主的评论
    comments.map(comment => {
      let commentLi = document.createElement("li");
      commentLi.className = "o-comment";
      commentLi.innerHTML = `<div class="o-c-header">
                            <span class="o-c-name">${comment.name}</span>
                          </div>
                          <div class="o-c-text">${comment.comment}</div>
                          <div class="o-c-footer">
                            <span class="o-c-date">
                            ${this.dateFormat("YYYY-mm-dd HH:MM:SS", new Date(comment.date))}
                            </span>
                            <span class="reply-button" data-id="${comment.id}"
                              data-name="${comment.name}">回复</span>
                          </div>
                          <ul class="o-replys"></ul>`;
      commentLi.getElementsByClassName("reply-button")[0].onclick = this.changeReplyTo;
      let replyUl = commentLi.getElementsByClassName("o-replys")[0];
      // 渲染子节点
      for (let i = 0; i < comment.children.length; i++) {
        this.traversal(comment.children[i], replyUl, comment.name, 1);
      }
      this.options.o3oNode.getElementsByClassName("o-c-list")[0].appendChild(commentLi);
    });
    this.options.o3oNode.getElementsByClassName("o-c-count")[0].innerText = comments.length;
  };

  //深度遍历评论树
  traversal = (comment, replyUl, father, depth) => {
    let replyLi = document.createElement("li");
    replyLi.innerHTML = `<div class="o-r-header">
                        <span class="o-c-name">${comment.name}</span>
                        </div>
                        <div class="o-r-text">${comment.comment}</div>
                        <div class="o-c-footer">
                          <span class="o-c-date">
                          ${this.dateFormat("YYYY-mm-dd HH:MM:SS", new Date(comment.date))}
                          </span>
                          <span class="reply-button" data-id="${comment.id}"
                          data-name="${comment.name}">回复</span>
                        </div>`;
    replyLi.className = "o-reply";
    replyLi.getElementsByClassName("reply-button")[0].onclick = this.changeReplyTo;
    if (depth != 1) {
      let span1 = document.createElement("span");
      span1.innerText = "→ ";
      let span2 = document.createElement("span");
      span2.innerText = father;
      span2.className = "o-c-name";
      replyLi.getElementsByClassName("o-r-header")[0].appendChild(span1);
      replyLi.getElementsByClassName("o-r-header")[0].appendChild(span2);
    }
    replyUl.appendChild(replyLi);
    for (let i = 0; i < comment.children.length; i++) {
      this.traversal(comment.children[i], replyUl, comment.name, depth + 1);
    }
  };

  // 更改回复人
  changeReplyTo = event => {
    const { target } = event;
    console.log("回复:" + target.getAttribute("data-id"));
    this.commentInfo.parentId = parseInt(target.getAttribute("data-id"));
    this.options.o3oNode.getElementsByClassName("at-user")[0].innerText = `@${target.getAttribute("data-name")}`;
  };

  // 日期格式化
  dateFormat = (fmt, date) => {
    let ret;
    const opt = {
      "Y+": date.getFullYear().toString(), // 年
      "m+": (date.getMonth() + 1).toString(), // 月
      "d+": date.getDate().toString(), // 日
      "H+": date.getHours().toString(), // 时
      "M+": date.getMinutes().toString(), // 分
      "S+": date.getSeconds().toString() // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
      ret = new RegExp("(" + k + ")").exec(fmt);
      if (ret) {
        fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0"));
      }
    }
    return fmt;
  };

  // 使发布按钮无法提交
  lockSubmit = () => {
    this.options.o3oNode.getElementsByClassName("c-b-submit")[0].className = "c-b-submit c-b-button b-lock";
  };

  // 解锁发布按钮
  unlockSubmit = () => {
    this.options.o3oNode.getElementsByClassName("c-b-submit")[0].className = "c-b-submit c-b-button";
  };

  // 消除输入框警告回调
  inputReset = (event, type) => {
    let classArray = event.target.className.split(" ");
    classArray = classArray.filter(c => c !== "c-i-warning");
    event.target.className = classArray.join(" ");
    if (type === "name") {
      event.target.setAttribute("placeholder", "昵称");
      event.target.value = this.userInfo.name;
    } else if (type === "email") {
      event.target.setAttribute("placeholder", "邮箱");
      event.target.value = this.userInfo.email;
    } else if (type === "site") {
      event.target.setAttribute("placeholder", "网址");
      event.target.value = this.userInfo.site;
    } else if (type === "comment") {
      event.target.setAttribute("placeholder", "留下你的足迹~");
      event.target.value = this.commentInfo.comment;
    }
  };

  // 字数检查
  wordCountCheck = () => {
    const countNumElement = this.options.o3oNode.getElementsByClassName("count-num")[0];
    const count = this.commentInfo.wordCount;
    countNumElement.innerText = count;
    if (count > 400) {
      countNumElement.className = "count-num warning";
      this.lockSubmit();
    } else {
      countNumElement.className = "count-num";
      this.unlockSubmit();
    }
  };

  // 检查昵称合法性回调
  nickNameCheck = () => {
    let result = true;
    const ciNickname = this.options.o3oNode.getElementsByClassName("ci-nickname")[0];
    if (this.userInfo.name == "") {
      ciNickname.setAttribute("placeholder", "请输入昵称!");
      result = false;
    } else if (this.userInfo.name.length > 20) {
      ciNickname.setAttribute("placeholder", "昵称最长为20!");
      result = false;
    }
    if (!result) {
      ciNickname.value = "";
      ciNickname.className = "c-i-input ci-nickname c-i-warning";
    }
    return result;
  };

  // 检查邮箱合法性回调
  emailCheck = () => {
    let result = true;
    const ciEmail = this.options.o3oNode.getElementsByClassName("ci-email")[0];
    if (this.userInfo.email == "") {
      ciEmail.setAttribute("placeholder", "请输入邮箱!");
      result = false;
    } else if (this.userInfo.email.length > 30) {
      ciEmail.setAttribute("placeholder", "邮箱最长为30!");
      result = false;
    } else if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(this.userInfo.email)) {
      ciEmail.setAttribute("placeholder", "邮箱不正确!");
      result = false;
    }
    if (!result) {
      ciEmail.value = "";
      ciEmail.className = "c-i-input ci-email c-i-warning";
    }
    return result;
  };

  // 网址合法性检查回调
  siteCheck = () => {
    let result = true;
    const ciSite = this.options.o3oNode.getElementsByClassName("ci-site")[0];
    if (this.userInfo.site == "") {
      ciSite.setAttribute("placeholder", "请输入网址!");
      result = false;
    } else if (this.userInfo.site.length > 30) {
      ciSite.setAttribute("placeholder", "网址最长为30!");
      result = false;
    } else if (
      !/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(
        this.userInfo.site
      )
    ) {
      ciSite.setAttribute("placeholder", "网址格式错误!");
      result = false;
    }
    if (!result) {
      ciSite.value = "";
      ciSite.className = "c-i-input ci-site c-i-warning";
    }
    return result;
  };

  // 评论合法性检查回调
  commentCheck = () => {
    const cArea = this.options.o3oNode.getElementsByClassName("c-area")[0];
    if (this.commentInfo.comment == "") {
      cArea.setAttribute("placeholder", "请输入评论!");
      cArea.value = "";
      cArea.className = "c-area c-i-warning";
      return false;
    }
    return true;
  };
}
