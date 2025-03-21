import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import HeaderButtonWithToolTip from "../gui/HeaderButtonWithToolTip";
import { ChatHistoryItem } from "core";
import { useState, useContext } from "react";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useAppSelector } from "../../redux/hooks";

export interface FeedbackButtonsProps {
  item: ChatHistoryItem;
}

export default function FeedbackButtons({ item }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<boolean | undefined>(undefined);
  const ideMessenger = useContext(IdeMessengerContext);
  const sessionId = useAppSelector((store) => store.session.id);

  const sendFeedback = (feedback: boolean) => {
    setFeedback(feedback);
    // 添加 trackFeatureUsage 统计点赞和踩
    const featureUsage = feedback ? 'chat/thumbsUp' : 'chat/thumbsDown';
    ideMessenger.request("stats/trackFeatureUsages", { feature: featureUsage });
    if (item.promptLogs?.length) {
      for (const promptLog of item.promptLogs) {
        ideMessenger.post("devdata/log", {
          name: "chatFeedback",
          data: {
            ...promptLog,
            feedback,
            sessionId,
          },
        });
      }
    }
  };

  return (
    <>
      <HeaderButtonWithToolTip
        text="Helpful"
        tabIndex={-1}
        onClick={() => sendFeedback(true)}
      >
        <HandThumbUpIcon
          className={`mx-0.5 h-3.5 w-3.5 ${feedback === true ? "text-green-400" : "text-gray-500"}`}
        />
      </HeaderButtonWithToolTip>
      <HeaderButtonWithToolTip
        text="Unhelpful"
        tabIndex={-1}
        onClick={() => sendFeedback(false)}
      >
        <HandThumbDownIcon
          className={`h-3.5 w-3.5 ${feedback === false ? "text-red-400" : "text-gray-500"}`}
        />
      </HeaderButtonWithToolTip>
    </>
  );
}
