import * as React from "react";
import * as qs from "query-string";
import * as api from "../../services/peakWarning";
import { Checkbox, Button, Toast, TextareaItem } from "antd-mobile";
import * as styles from "./index.scss";
const CheckboxItem = Checkbox.CheckboxItem;
const { useState, useEffect } = React;
export default React.memo(() => {
  const [data, setData] = useState({
    storeName: "",
    pictureUrl: "",
    resultContent: [],
    pictureTime: "",
  });
  const [loading, setLoading] = useState(null);
  const [ButtonStatus, setButtonStatus] = useState(false);
  const [checkIds, setCheckIds] = useState([]);
  const [msgid, setMsgid] = useState(null);
  const [view, setView] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  useEffect(() => {
    document.title = "收银高峰预警";
    loadingToast();
    getDetailData();
  }, []);
  const getDetailData = () => {
    const params = qs.parse(window.location.search);
    const { msgid } = params;
    // const msgid = "2bffdc2f-5837-4159-aa21-f91fd14e9c8b";
    setMsgid(msgid);
    setLoading(true);
    api
      .getDetailData({ msgid }, true)
      .then((res: any) => {
        Toast.hide();
        if (res) {
          const { reply_content, resultContent } = res;

          // 判断按钮状态
          const isView = resultContent
            ? resultContent.some((item: any) => {
                return item.isSelected === 1;
              })
            : false;

          // 非排对现象原因
          setReplyContent(res.reply_content || "");

          // 获取已经选择的ids
          const tempIds = [];
          resultContent &&
            resultContent.map((item: any) => {
              if (item.isSelected === 1) {
                tempIds.push(item.id);
              }
            });

          setCheckIds(tempIds);
          setView(isView);
          setData(res);
        }
      })
      .catch((err) => {
        Toast.hide();
      });
  };

  const handleChange = (event: any, id: any) => {
    const { target } = event;
    const { checked } = target;
    let ids = [...checkIds];
    if (checked) {
      ids.push(id);
    } else {
      if (+id === 4) {
        setReplyContent("");
      }
      ids = checkIds.filter((item) => {
        return item !== id;
      });
    }
    setCheckIds(ids);
  };

  const handleSubmit = () => {
    // 拦截非排队现象 必须要输入说明
    if (checkIds.includes(4) && replyContent.length === 0) {
      Toast.info("请输入非排队现象原因", 2, null, false);
      return;
    }

    const data = { result_content: checkIds, reply_content: replyContent };
    if (checkIds.length > 0) {
      api.submitResult({ msgid, data }, true).then((res: any) => {
        Toast.success("提交成功", 2, () => {}, false);
        getDetailData();
        setButtonStatus(true);
      });
    } else {
      Toast.info("请选择处理方式", 2, null, false);
    }
  };

  const loadingToast = () => {
    Toast.loading("Loading...", 0, () => {}, true);
  };

  const onTextAreaChange = (input: any) => {
    setReplyContent(input);
  };

  return (
    <>
      <div className={styles.content}>
        <div>
          <p className={styles.title}>收银高峰期预警</p>
          <p className={styles.font}>
            门店：{data.storeName ? data.storeName : ""}
          </p>
          <p className={styles.font}>
            时间：{data.pictureTime ? data.pictureTime : ""}
          </p>
        </div>
        <img src={data.pictureUrl} className={styles.image} />
        <p className={styles.selectFont}>请选择处理方式：</p>
        <div>
          {data.resultContent
            ? data.resultContent.map((item, index) => {
                return (
                  <CheckboxItem
                    key={item.id}
                    value={item.id}
                    disabled={item.isSelected === 1}
                    defaultChecked={item.isSelected === 1}
                    onChange={(e) => {
                      handleChange(e, item.id);
                    }}
                  >
                    <span className={styles.checkboxItem}>
                      {index + 1}.{item.result}
                    </span>
                  </CheckboxItem>
                );
              })
            : ""}
        </div>
        <div
          className={styles.textArea}
          style={{ display: checkIds.includes(4) ? "" : "none" }}
        >
          <TextareaItem
            disabled={view}
            placeholder="请输入非排队现象原因"
            value={replyContent}
            rows={3}
            count={1000}
            onChange={onTextAreaChange}
          />
        </div>
      </div>
      <Button
        type="primary"
        className={styles.submitButton}
        onClick={handleSubmit}
        disabled={view}
      >
        提交
      </Button>
    </>
  );
});
