import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const apiKey = "RGAPI-55e6d680-3f20-435f-b04b-a8b2c6322cfd";
const urlPrefix = "https://kr.api.riotgames.com/";
const gameVersion = "10.13.1";
const cdnUrlPrefix = `http://ddragon.leagueoflegends.com/cdn/${gameVersion}`;

let spellInfos = {};
let champInfos = {};

function App() {
  const [targetName, setTargetName] = useState("");
  const [enemies, setEnemies] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const onTargetNameChange = (e) => {
    setTargetName(e.target.value);
  };

  const onSearchClick = () => {
    const loadTarget = async () => {
      setLoading(true);

      let userInfo;
      try {
        const userInfoUri = `${urlPrefix}lol/summoner/v4/summoners/by-name/${targetName}`;
        const userInfoResult = await axios.get(userInfoUri, {
          params: {
            api_key: apiKey,
          },
        });
        userInfo = userInfoResult.data;
      } catch (error) {
        if (error.response) {
          if (error.response.status == 404)
            setErrorMessage("존재하지 않는 유저 입니다.");
        }
        setLoading(false);
        return;
      }

      let activeGameInfo;
      try {
        const activeGameUri = `${urlPrefix}lol/spectator/v4/active-games/by-summoner/${userInfo["id"]}`;
        const activeGameResult = await axios.get(activeGameUri, {
          params: {
            api_key: apiKey,
          },
        });
        activeGameInfo = activeGameResult.data;
      } catch (error) {
        if (error.response) {
          if (error.response.status == 404)
            setErrorMessage("진행 중인 게임이 없습니다.");
        }
        setLoading(false);
        return;
      }

      if (activeGameInfo["mapId"] != 11) return false;

      let myTeamId;
      const participants = activeGameInfo["participants"];
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        if (participant["summonerName"] === targetName) {
          myTeamId = participant["teamId"];
          break;
        }
      }

      let enemyDatas = [];
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        if (participant["teamId"] != myTeamId) enemyDatas.push(participant);
      }

      let enemyInfos = [];
      for (let i = 0; i < 5; i++) {
        const enemy = enemyDatas[i];
        const name = enemy["summonerName"];

        const champId = enemy["championId"];
        const champInfo = champInfos[champId];
        const champImage = `${cdnUrlPrefix}/img/champion/${champInfo.id}.png`;

        const spell1 = spellInfos[enemy["spell1Id"]];
        const spell1Name = spell1.name;
        const spell1Image = `${cdnUrlPrefix}/img/spell/${spell1.id}.png`;

        const spell2 = spellInfos[enemy["spell2Id"]];
        const spell2Name = spell2.name;
        const spell2Image = `${cdnUrlPrefix}/img/spell/${spell2.id}.png`;

        const info = {
          name: name,
          champImage: champImage,
          spell1Name: spell1Name,
          spell1Image: spell1Image,
          spell2Name: spell2Name,
          spell2Image: spell2Image,
        };
        enemyInfos.push(info);
      }

      setLoading(false);
      setEnemies(enemyInfos);
    };

    loadTarget();
  };

  useEffect(() => {
    const initData = async () => {
      const spellDataResult = await axios.get(
        `${cdnUrlPrefix}/data/en_US/summoner.json`
      );

      const spellDatas = spellDataResult.data.data;
      for (const id in spellDatas) {
        let info = spellDatas[id];
        spellInfos[info["key"]] = info;
      }

      const champDataResult = await axios.get(
        `${cdnUrlPrefix}/data/en_US/champion.json`
      );

      const champDatas = champDataResult.data.data;
      for (const id in champDatas) {
        let info = champDatas[id];
        champInfos[info["key"]] = info;
      }

      setLoading(false);
    };

    initData();
  }, []);

  if (isLoading) {
    return <div>로딩 중</div>;
  }

  if (enemies.length == 0) {
    return (
      <div>
        <input
          value={targetName}
          onChange={onTargetNameChange}
          placeholder="닉네임을 입력해주세요."
        />
        <button onClick={onSearchClick}>찾기</button>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        {enemies.map((enemy) => (
          <div>
            <img src={enemy.champImage} />
            <br />
            <img src={enemy.spell1Image} />
            <img src={enemy.spell2Image} />
          </div>
        ))}
      </header>
    </div>
  );
}

export default App;
