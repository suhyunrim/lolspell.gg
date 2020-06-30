import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import axios from "axios";
import "./App.css";

const apiKey = "RGAPI-55e6d680-3f20-435f-b04b-a8b2c6322cfd";
const urlPrefix = "https://kr.api.riotgames.com/";

let spellInfos = {};
let champInfos = {};

function App() {
    useEffect(() => {
        const initData = async () => {
            const spellData = await axios.get(
                'http://ddragon.leagueoflegends.com/cdn/9.24.2/data/en_US/summoner.json'
            );

            const spellInfos = spellData.data.data;
            for (const key in spellInfos) {
                let info = spellInfos[key];
                spellInfos[info["key"]] = info;
            }

            const champData = await axios.get(
              'http://ddragon.leagueoflegends.com/cdn/9.24.2/data/en_US/champion.json'
            )

            const champInfos = champData.data.data;
            for (const key in champInfos) {
                let info = champInfos[key];
                champInfos[info["key"]] = info;
            }

            console.log('test');
        };

        initData();
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
