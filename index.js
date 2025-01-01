// ==UserScript==
// @name         DNF《勇士的意志》漫画活动脚本
// @homepage     
// @version      2025-01-01
// @description  《勇士的意志》第二季活动观看获取星星
// @version      1.0
// @author       Par9uet
// @match        https://dnf.qq.com/cp/a20231211comic/index.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qq.com
// @grant        GM_addElement
// ==/UserScript==

(function () {
  "use strict";
  const delay = async (ts) => new Promise((resolve) => setTimeout(resolve, ts));
  const submitFlow = amsCommon.submitFlow;
  let promiseResolve;
  const createPromise = () => {
    return new Promise((resolve) => {
      promiseResolve = resolve;
    });
  };
  amsCommon.submitFlow = function (
    token,
    showLoading,
    sData,
    successCallback,
    failCallback
  ) {
    let sc = successCallback;
    let fc = failCallback;
    if (token === "0a571a") {
      sc = function (res) {
        promiseResolve?.(res);
        successCallback(res);
      };
      fc = function (res) {
        promiseResolve?.(res);
        failCallback(res);
      };
    }
    return submitFlow.call(this, token, showLoading, sData, sc, fc);
  };

  const ui = (function ({ onButtonClick }) {
    let loading = false;
    const container = document.createElement("div");
    container.style =
      "position: fixed; right: 0; top: 0; z-index: 9999; padding: 10px; background: #fff";
    const messageTitle = document.createElement("div");
    messageTitle.innerText = "消息列表";
    const message = document.createElement("ul");
    message.style =
      "list-style-type:disc; padding-left: 20px; max-height: 20vh; overflow: auto";
    const button = document.createElement("button");
    button.innerText = "开始获取星星";
    button.style =
      "appearance: none; padding: 10px 20px; background: #f00; color: #fff; border: none; cursor: pointer;";
    container.appendChild(button);
    container.appendChild(document.createElement("hr"));
    container.appendChild(messageTitle);
    container.appendChild(message);

    button.addEventListener("click", () => {
      if (loading) {
        return;
      }
      onButtonClick();
    });

    return {
      // 挂在到网页上
      mount() {
        document.body.appendChild(container);
      },
      // 添加输出消息
      addMessage(msg) {
        const li = document.createElement("li");
        li.innerText = msg;
        message.appendChild(li);
        li.scrollIntoView();
      },
      buttonLoading(_loading) {
        loading = _loading;
        button.innerText = loading ? "处理中..." : "开始获取星星";
        button.disabled = _loading;
      },
    };
  })({
    onButtonClick: async () => {
      // 得到已更新的索引
      const getIndexList = (index) => {
        const comicList = Array.from(
          document.querySelector(`#comicList_${index}`).childNodes
        );
        return comicList
          .filter(
            (el) =>
              el.childNodes.length === 1 &&
              el.childNodes[0].tagName.toLowerCase() === "a"
          )
          .map((el) => Number.parseInt(el.id.split("_")[1]));
      };

      // 处理逻辑
      ui.buttonLoading(true);
      const tabList = Array.from(
        document.querySelectorAll(".movice-tabs .movice-item")
      ).map((el, index) => ({ el, index: index + 1 }));
      ui.addMessage(
        `检测到${tabList.length}个 tab （对应 1-30 ， 31-60 这些项的个数）`
      );
      for (const tab of tabList) {
        const { el, index } = tab;
        ui.addMessage(`切换到 ${el.innerText} 项`);
        el.click();
        delay(1000);
        const indexList = getIndexList(index);
        ui.addMessage(`可获取星星的索引 ${indexList.join(",")}`);
        for (const index of indexList) {
          // 调用获取星星的接口
          ui.addMessage(`调用获取索引 ${index} 的星星索引接口`);
          const promise = createPromise();
          amsCommon.lotteryStar(index);
          const res = await promise;
          if (res.iRet == 100001) {
            ui.addMessage(`调用结果 已领取该奖励`);
          } else if (res.iRet === 0) {
            ui.addMessage(`调用结果 获得 1 个星星`);
          } else {
            ui.addMessage(`调用结果 JSON.stringify(res)`);
          }
          await delay(1000);
        }
      }
      ui.buttonLoading(false);
      ui.addMessage("处理完成，三秒后自动刷新页面");
      await delay(3000);
      // 重新加载页面
      location.reload();
    },
  });

  ui.mount();
})();
