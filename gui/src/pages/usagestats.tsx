import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { table } from "table";
import { lightGray, vscBackground, vscInputBackground } from "../components";
import { CopyIconButton } from "../components/gui/CopyIconButton";
import { IdeMessengerContext } from "../context/IdeMessenger";
import { useNavigationListener } from "../hooks/useNavigationListener";

const Th = styled.th`
    padding: 0.5rem;
    text-align: left;
    border: 1px solid ${lightGray};
`;

const Tr = styled.tr`
    &:hover {
        background-color: ${vscInputBackground};
    }

    overflow-wrap: anywhere;

    border: 1px solid ${lightGray};
`;

const Td = styled.td`
    padding: 0.5rem;
    border: 1px solid ${lightGray};
`;

interface FeatureUsageItem {
  username: string;
  feature: string;
  usageCount: number;
}

function generateTable(data: unknown[][]) {
  return table(data);
}

const UserUsageStats = () => {
  useNavigationListener();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);

  console.group('UserUsageStats Component');
  console.log('ideMessenger:', ideMessenger);
  console.log('ideMessenger type:', typeof ideMessenger);
  console.groupEnd();

  const [featureUsage, setFeatureUsage] = useState<FeatureUsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<
    { day: string; promptTokens: number; generatedTokens: number }[]
  >([]);

  const fetchFeatureUsage = async () => {
    console.group('Fetch Feature Usage');
    console.log('Starting fetchFeatureUsage');
    console.log('ideMessenger in fetchFeatureUsage:', ideMessenger);

    try {
      setIsLoading(true);
      setError(null);

      if (!ideMessenger || !ideMessenger.streamRequest) {
        console.error('ideMessenger or streamRequest is not available');
        throw new Error('Messenger not initialized');
      }

      // const usagePromise = ideMessenger.streamRequest("subprocess", {
      //   command: "stats/getFeatureUsage"
      // });

      ideMessenger.request("stats/getTokensPerDay", undefined).then((result) => {
        result.status === "success" && setDays(result.content);
      });

      ideMessenger
        .request("stats/getFeatureUsage", undefined)
        .then((result) => {
          console.log("test：",result);
          result.status === "success" && setFeatureUsage(result.content);
        });



      console.log('Raw usageResult:', JSON.stringify(featureUsage, null, 2));
      console.log('Type of usageResult:', typeof featureUsage);
      console.log('Is Array:', Array.isArray(featureUsage));

      let sanitizedUsage: FeatureUsageItem[] = [];

      if (featureUsage) {
        if (Array.isArray(featureUsage)) {
          sanitizedUsage = featureUsage
            .filter((item: any) => {
              const isValidItem = item
                && typeof item === 'object'
                && typeof item.username === 'string'
                && typeof item.feature === 'string'
                && typeof item.usageCount === 'number';

              if (!isValidItem) {
                console.warn('Invalid feature usage item:', item);
              }

              return isValidItem;
            })
            .map((item: any): FeatureUsageItem => ({
              username: item.username,
              feature: item.feature,
              usageCount: item.usageCount
            }));
        } else if (typeof featureUsage === 'object') {
          const item = featureUsage as any;
          if (
            typeof item.username === 'string' &&
            typeof item.feature === 'string' &&
            typeof item.usageCount === 'number'
          ) {
            sanitizedUsage = [item];
          }
        }
      }

      console.log('Sanitized Usage:', sanitizedUsage);

      if (sanitizedUsage.length === 0) {
        console.warn('No valid feature usage data found. Using default.');
        sanitizedUsage = [{
          username: 'default',
          feature: 'Unknown',
          usageCount: 0
        }];
      }

      setFeatureUsage(sanitizedUsage);
      setIsLoading(false);
      console.groupEnd();
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch feature usage');
      setFeatureUsage([{
        username: 'default',
        feature: 'Unknown',
        usageCount: 0
      }]);
      setIsLoading(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    if (ideMessenger) {
      fetchFeatureUsage();
    } else {
      console.warn('ideMessenger is not available');
    }
  }, []);

  if (isLoading) {
    return <div>Loading feature usage...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div
        className="items-center flex m-0 p-0 sticky top-0"
        style={{
          borderBottom: `0.5px solid ${lightGray}`,
          backgroundColor: vscBackground,
        }}
      >
        <ArrowLeftIcon
          width="1.2em"
          height="1.2em"
          onClick={() => navigate(-1)}
          className="inline-block ml-4 cursor-pointer"
        />
        <h3 className="text-lg font-bold m-2 inline-block">Feature Usage</h3>
      </div>
      <h2 className="text-xl font-bold mb-4">Feature Usage Statistics</h2>
      <div className="mb-4">
        <CopyIconButton
          text={generateTable(
            [
              ["Username", "Feature", "Usage Count"],
              ...featureUsage.map((stat) => [
                stat.username,
                stat.feature,
                stat.usageCount
              ])
            ]
          )}
        />
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2">Username</th>
          <th className="border border-gray-300 p-2">Feature</th>
          <th className="border border-gray-300 p-2">Usage Count</th>
        </tr>
        </thead>
        <tbody>
        {featureUsage.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="border border-gray-300 p-2">{item.username}</td>
            <td className="border border-gray-300 p-2">{item.feature}</td>
            <td className="border border-gray-300 p-2 text-right">{item.usageCount}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {featureUsage.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No feature usage data available</p>
      )}
    </div>
  );
}

export default UserUsageStats;
