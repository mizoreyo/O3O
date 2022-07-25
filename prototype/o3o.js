var replyTo = null
var pageId = "1"

function getComments() {
  fetch("http://localhost:8080/comment/tree/1")
    .then(response => response.json())
    .then((json) => {
      console.log(json)
      treeToDom(json.data)
    })
    .catch((error) => {
      console.log(error)
    })
}

function comment() {
  let requestBody = {
    pageId: pageId
  }
  if (replyTo != null) {
    requestBody.replyTo = replyTo
  }
  // 检查昵称
  let ciNickname = document.getElementsByClassName("ci-nickname")[0]
  if (nickNameCheck(ciNickname)) {
    requestBody.guestName = document.getElementsByClassName("ci-nickname")[0].value.trim()
  } else {
    return
  }
  // 检查邮箱
  let ciEmail = document.getElementsByClassName("ci-email")[0]
  if (emailCheck(ciEmail)) {
    requestBody.guestEmail = document.getElementsByClassName("ci-email")[0].value.trim()
  } else {
    return
  }
  // 检查网址
  let ciSite = document.getElementsByClassName("ci-site")[0]
  if (siteCheck(ciSite)) {
    requestBody.guestSite = document.getElementsByClassName("ci-site")[0].value.trim()
  } else {
    return
  }

  let cArea = document.getElementsByClassName("c-area")[0]
  if (commentCheck(cArea)) {
    requestBody.comment = document.getElementsByClassName("c-area")[0].value.trim()
  } else {
    return
  }

  fetch("http://localhost:8080/comment/add", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    }
  })
    .then(response => response.json())
    .then((json) => {
      console.log(json);
      getComments()
    })
}

function nickNameCheck(ciNickname) {
  let result = true
  if (ciNickname.value.trim() == "") {
    ciNickname.setAttribute("placeholder", "请输入昵称！")
    result = false
  } else if (ciNickname.value.trim().length > 10) {
    ciNickname.setAttribute("placeholder", "昵称最长为10！")
    result = false
  }
  if (!result) {
    document.getElementsByClassName("ci-nickname")[0].value = ""
    ciNickname.className = ciNickname.className + " c-i-warning"
  }
  return result
}

function emailCheck(ciEmail) {
  let result = true
  if (ciEmail.value.trim() == "") {
    ciEmail.setAttribute("placeholder", "请输入邮箱！")
    result = false
  } else if (ciEmail.value.trim().length > 30) {
    ciEmail.setAttribute("placeholder", "邮箱最长为30！")
    result = false
  } else if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(ciEmail.value.trim())) {
    ciEmail.setAttribute("placeholder", "邮箱不正确！")
    result = false
  }
  if (!result) {
    document.getElementsByClassName("ci-email")[0].value = ""
    ciEmail.className = ciEmail.className + " c-i-warning"
  }
  return result
}

function siteCheck(ciSite) {
  let result = true
  if (ciSite.value.trim() == "") {
    ciSite.setAttribute("placeholder", "请输入网址！")
    result = false
  } else if (ciSite.value.trim().length > 30) {
    ciSite.setAttribute("placeholder", "网址最长为30！")
    result = false
  } else if (!/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(ciSite.value.trim())) {
    ciSite.setAttribute("placeholder", "网址错误！")
    result = false
  }
  if (!result) {
    document.getElementsByClassName("ci-site")[0].value = ""
    ciSite.className = ciSite.className + " c-i-warning"
  }
  return result
}

function commentCheck(cArea) {
  if (cArea.value.trim() == "") {
    cArea.setAttribute("placeholder", "请输入评论！")
    document.getElementsByClassName("c-area")[0].value = ""
    cArea.className = cArea.className + " c-i-warning"
    return false
  }
  if (cArea.value.trim().length > 400) {
    return false
  }
  return true
}

function countWords(athis) {
  const count = athis.value.length
  document.getElementsByClassName("count-num")[0].innerText = count
  if (count > 400) {
    document.getElementsByClassName("count-num")[0].className = "count-num warning"
  } else {
    document.getElementsByClassName("count-num")[0].className = "count-num"
  }
}

function treeToDom(tree) {
  document.getElementsByClassName("o-c-list")[0].innerHTML = ""
  tree.map((comment1) => {
    let commentLi = document.createElement("li")
    commentLi.className = "o-comment"
    commentLi.innerHTML = `<div class="o-c-header">
                            <span class="o-c-guestName">${comment1.guestName}</span>
                          </div>
                          <div class="o-c-text">${comment1.comment}</div>
                          <div class="o-c-footer">
                            <span class="o-c-date">${dateFormat("YYYY-mm-dd HH:MM:SS", new Date(comment1.date))}</span>
                            <span class="reply-button" data-id="${comment1.id}" data-guestName="${comment1.guestName}"
                              onclick="changeReplyTo(this)">回复</span>
                          </div>
                          <ul class="o-replys"></ul>`
    let replyUl = commentLi.getElementsByClassName("o-replys")[0]
    for (let i = 0; i < comment1.replys.length; i++) {
      traversal(comment1.replys[i], replyUl, comment1.guestName, 1)
    }
    document.getElementsByClassName("o-c-list")[0].appendChild(commentLi)
  })
  document.getElementsByClassName("o-c-count")[0].innerText = tree.length
}

//深度遍历评论树
function traversal(comment, replyUl, father, depth) {
  let replyLi = document.createElement("li")
  replyLi.innerHTML = `<div class="o-r-header">
                        <span class="o-c-guestName">${comment.guestName}</span>
                        </div>
                        <div class="o-r-text">${comment.comment}</div>
                        <div class="o-c-footer">
                          <span class="o-c-date">${dateFormat("YYYY-mm-dd HH:MM:SS", new Date(comment.date))}</span>
                          <span class="reply-button" data-id="${comment.id}" data-guestName="${comment.guestName}"
                            onclick="changeReplyTo(this)">回复</span>
                        </div>`
  replyLi.className = "o-reply"
  if (depth != 1) {
    let span1 = document.createElement("span")
    span1.innerText = "→ "
    let span2 = document.createElement("span")
    span2.innerText = father
    span2.className = "o-c-guestName"
    replyLi.getElementsByClassName("o-r-header")[0].appendChild(span1)
    replyLi.getElementsByClassName("o-r-header")[0].appendChild(span2)
  }
  replyUl.appendChild(replyLi)
  for (let i = 0; i < comment.replys.length; i++) {
    traversal(comment.replys[i], replyUl, comment.guestName, depth + 1)
  }
}

function changeReplyTo(athis) {
  console.log("回复:" + athis.getAttribute("data-id"));
  replyTo = parseInt(athis.getAttribute("data-id"))
  document.getElementsByClassName("at-user")[0].innerText = `@${athis.getAttribute("data-guestName")}`
}

function resetReplyTo() {
  replyTo = null
  document.getElementsByClassName("at-user")[0].innerText = "@"
}

function dateFormat(fmt, date) {
  let ret;
  const opt = {
    "Y+": date.getFullYear().toString(),        // 年
    "m+": (date.getMonth() + 1).toString(),     // 月
    "d+": date.getDate().toString(),            // 日
    "H+": date.getHours().toString(),           // 时
    "M+": date.getMinutes().toString(),         // 分
    "S+": date.getSeconds().toString()          // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
    };
  };
  return fmt;
}