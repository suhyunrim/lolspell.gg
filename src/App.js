import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import { ReactSortable } from "react-sortablejs";
import copy from "copy-to-clipboard";  

const apiKey = "RGAPI-55e6d680-3f20-435f-b04b-a8b2c6322cfd";
const urlPrefix = "https://kr.api.riotgames.com/";
const gameVersion = "10.13.1";
const cdnUrlPrefix = `http://ddragon.leagueoflegends.com/cdn/${gameVersion}`;

const adjustColldownSeconds = 10;
const positionOrder = ["top", "jg", "mid", "ad", "sup"];

let spellInfos = {};
let champInfos = {};

function App() {
  const [targetName, setTargetName] = useState("");
  const [enemies, setEnemies] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameStartTime, setGameStartTime] = useState(0);

  const onTargetNameChange = (e) => {
    setTargetName(e.target.value);
  };

  const onClickSpell = (summonerId, spellId, spellIndex) => {
    const spellInfo = spellInfos[spellId];
    let cooldown = new Date();
    cooldown.setSeconds(
      cooldown.getSeconds() +
        parseInt(spellInfo.cooldownBurn) -
        adjustColldownSeconds
    );

    const foundIndex = enemies.findIndex(
      (elem) => elem.summonerId === summonerId
    );
    if (foundIndex === -1) return;

    enemies[foundIndex].spells[spellIndex].cooldown = cooldown;
    setEnemies(enemies);

    refreshClipboard();
  };

  const refreshClipboard = () => {
    const usedSpellList = [];
    const curDate = new Date();
    for (const index in enemies) {
      const enemy = enemies[index];
      enemy.spells.forEach((spell) => {
        if (spell.cooldown > 0 && spell.cooldown >= curDate) {
          const until = spell.cooldown - new Date(gameStartTime);
          usedSpellList.push({
            position: positionOrder[index],
            spell: spell,
            until: until,
          });
        }
      });
    }

    usedSpellList.sort((a, b) => a.until - b.until);

    let spellMessage = '';
    for (const index in usedSpellList)
    {
      const info = usedSpellList[index];
      const date = new Date(info.until);
      spellMessage += `${info.position} ${info.spell.name} ${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')} `;
    }

    copy(spellMessage);
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
          if (error.response.status === 404)
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
          if (error.response.status === 404)
            setErrorMessage("진행 중인 게임이 없습니다.");
        }
        setLoading(false);
        return;
      }

      if (activeGameInfo["mapId"] !== 11) return false;

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
        if (participant["teamId"] !== myTeamId) enemyDatas.push(participant);
      }

      let enemyInfos = [];
      for (let i = 0; i < 5; i++) {
        const enemy = enemyDatas[i];
        const name = enemy["summonerName"];
        const summonerId = enemy["summonerId"];

        const champId = enemy["championId"];
        const champInfo = champInfos[champId];
        const champImage = `${cdnUrlPrefix}/img/champion/${champInfo.id}.png`;

        const spell1Id = enemy["spell1Id"];
        const spell1 = spellInfos[spell1Id];
        const spell1Name = spell1.name;
        const spell1Image = `${cdnUrlPrefix}/img/spell/${spell1.id}.png`;

        const spell2Id = enemy["spell2Id"];
        const spell2 = spellInfos[spell2Id];
        const spell2Name = spell2.name;
        const spell2Image = `${cdnUrlPrefix}/img/spell/${spell2.id}.png`;

        const info = {
          name: name,
          summonerId: summonerId,
          champImage: champImage,
          spells: [
            {
              id: spell1Id,
              name: spell1Name,
              image: spell1Image,
              colldown: 0,
            },
            {
              id: spell2Id,
              name: spell2Name,
              image: spell2Image,
              colldown: 0,
            },
          ],
        };
        enemyInfos.push(info);
      }

      setLoading(false);
      setEnemies(enemyInfos);
      setGameStartTime(activeGameInfo.gameStartTime);
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

  if (Object.keys(enemies).length === 0) {
    return (
      <div>
        <form onSubmit={onSearchClick}>
          <input
            value={targetName}
            onChange={onTargetNameChange}
            placeholder="닉네임을 입력해주세요."
          />
          <button type="submit">찾기</button>
          {errorMessage}
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <ReactSortable multiDrag swap list={enemies} setList={setEnemies}>
          {Object.entries(enemies).map(([_, enemy]) => (
            <div>
              <img src={enemy.champImage} alt="alt" />
              <br />
              {enemy.spells.map((spell, index) => (
                <button
                  onClick={() =>
                    onClickSpell(enemy.summonerId, spell.id, index)
                  }
                >
                  <img src={spell.image} alt="alt" />
                </button>
              ))}
            </div>
          ))}
        </ReactSortable>
      </header>
    </div>
  );
}

export default App;
