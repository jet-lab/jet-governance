import { PublicKey } from "@solana/web3.js";
import { GOVERNANCE_PROGRAM_SEED } from "./accounts";
import { JET_TOKEN_MINT, JET_GOVERNANCE, OYSTER_GOV_PROGRAM_ID } from "../utils";

export const getFirstTwoHundredPubkeys = async () => {
  let proposalIndexBuffer = Buffer.alloc(4);
  const pubkeysIndex = [];
  for (let i = 0; i < 200; i++) {
    proposalIndexBuffer.writeInt32LE(i, 0);
    const [proposalAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from(GOVERNANCE_PROGRAM_SEED),
        JET_GOVERNANCE.toBuffer(),
        JET_TOKEN_MINT.toBuffer(),
        proposalIndexBuffer,
      ],
      OYSTER_GOV_PROGRAM_ID
    );
    pubkeysIndex.push(proposalAddress.toString())
  }

  return pubkeysIndex;
}

const pubkeysIndex: Record<string, number> = {
  "GgGtNbPuR8sJBjzVdwb6bXwjpa1ZHEKHjMcGFg4WcAUH": 1,
  "vPT8VK7iMte9DqBC3Y7KinLS5WBRH5v9Yvtw9ToJ2Nv": 2,
  "8c7otaHyh9o6REp62YY7jUaHiowHqtKYnPZrcUEekGj5": 3,
  "HTX8DaMNHKuJYAGSQLJFt671ryaEqkEdsUBc7wococBW": 4,
  "45WLBdK5C8FZpC3iX5jV9NhSWH8Q4sm4hB6qspTMvtXP": 5,
  "Bb3mq6dY6MwmhMcmiJ5sCG56yaWdhFZEaNooDi5gzi82": 6,
  "HiZqZmS4aSG4yALmZrDhhN7otMDCenAtpdPVXaUUntog": 7,
  "64tG62TW2ynh7cBTw2QQcE1fXvQHL8rPdmvYFJsY9c4R": 8,
  "GYyvSs1SqrcXQzctGM8STRLdkKS8exix9NmLH8fVWmkB": 9,
  "Dd5F1NEtEGhivUsJPUW1MWWwKeFAPvTFs6tYVWNfGHxg": 10,
  "9CBRQXipt4FYz86wXhtp3U9VnexcFDpEx9oSSmxYo5BD": 11,
  "DbSvxbmGQUoxKgaNFxuau6sqrosokPWh9gUNCfV85NFB": 12,
  "6FKMyvKxtLY9Vh8yDagjZYXbHz98BSaQsV7M5yyJksQr": 13,
  "4aYVXdLEcRn2nJnbGJqyV1C1pdDMbt1ffwjF3Q12F4WB": 14,
  "2urJRnr4BuG684J6gEMcTqV1k1bAzXLPE7X1Kq48awM3": 15,
  "EZG5PgnmtxTs37gdAa6P1nTbd9g7PeJeHr7KE8ZLEE5o": 16,
  "7gKaFPK8WqSr4abTfpHrKWiW3WF5EK3Hqaz4TJdiiBte": 17,
  "8DXPa5WFqrNt3ibh4UHUHCfohdJ2YWe7fGw95pTm8edC": 18,
  "AvNoQnf4gyB2QV9rn58Di2EFAJxBLxJ1pAeLeRHsgYz8": 19,
  "Du1ZpQ4KRw6a3RaK8FpdSNm3zjE4GmFkdszLertkRVjP": 20,
  "HHTo7MV6BNFyQAnbsdVxWDiL2A68NekgMSGLmm8pzp3V": 21,
  "9XfvUg7WFkJfLKo8f4NHddrH9PkRi8KxWb2Zqn4oTzon": 22,
  "13Z7HmyUaWj4DQenZvieWwCooCiGdeX5sWmgH5ZCUEVT": 23,
  "Gf2jn9EeQrxwZAwtzCNH9rHkFkr8FJDPmkw7TEdg3Fjn": 24,
  "KtwcpRN3CxeixbN8rSYZRpyD37izpsE2a3UDWmqsDfE": 25,
  "7isdYuCodvPrexnJXkgUMF4Fj1A7Zet4rnvexxVBaupt": 26,
  "J5MicYdwDmnDWA6cYa9aFSTn35iECeqPyGZKKhy3nTfU": 27,
  "9EMdeUfNUM5cYm1vKNcmG1oDkU1agCMyc5NWM3mdHi2J": 28,
  "7ED7YMpvUpk9mdCCBU3ihorKdXZfygbQQvF559T85LCr": 29,
  "EFPTDLryGvhjEZM89ngjcT1p6JgBCTDoymYgsZb9zbzv": 30,
  "8Bz8QukK1pWq1SSYwTED5C1uj2V1yGwwyxB6J9n4Qnci": 31,
  "2oaaFDenV8umWRC27v7ZYfXLzZn5kYCaHaXCDbcDQB9u": 32,
  "FNK9q9rwj6dDN4gZN4QpQECuqnK18KHMDAaHBcuHjBxN": 33,
  "CaUUwuqytBdiZaqbiZtGW7M2AXzfunh7BmuvW52xj9xn": 34,
  "GCrgJKSrgVUXmEC1fg8pg1CbNFb9rxQ9Pp8t1YMw9nt7": 35,
  "DNW2w8EyHqAbkC5RFydxTSzj3kaHy2A9AzEU8BuHWf6c": 36,
  "GVz3qr2wDBCZUq9DQtyXmPsE3KK92KtQ4Tv9CmQZ9hG1": 37,
  "2GcuHpo5e5GE8cHhsxJfaqvENBEb12N4KfejkPsTt5KP": 38,
  "3nx4a17PZP8YK5ZKecfhqcJB58RSurN81Cv2ZZ7iG9Nc": 39,
  "J45TuR6epuPby9vueFpb85MgYwWDJdFPZs3TT93r1AaY": 40,
  "DREsPEcsRbkV4q6EL2tZZQLzNkmXjESxcyz4aYMzcaUD": 41,
  "ALTjmpDjKaXhqTVCxL5KCuNdn2pmEj5XjGtURFNw2KhG": 42,
  "HUQGL9oVYzqfweguTrW3G1DQT4purMGsjqwWXLPDRnBw": 43,
  "9juMDg5Hc49gmCH1cPhnHCyr4XhMkWXzCqJePVDiLtAF": 44,
  "6skNvT44igWE5mdEtqzSi6WQfArJADEjMRJ2Fs5q7gTC": 45,
  "CNs7ctgQQxTXvgsHqpKex3fR9LYyuSaD8xv9U1T64pKW": 46,
  "bFGo8PFgqGVPUPYjASpbeL5zVHvXnVH8Zmteh7mvHuB": 47,
  "HDMT62rEpacbeW3tFhf43xJG81xmZbmgrCSBYn78kamQ": 48,
  "8mGD9MaUrZKh4YJjvyoi7knVVnP74fyEneAua7HzodvJ": 49,
  "8xmL6esAo4HDnR48UpQ7Knzq5o98jEDHH3MXmf3wGdo": 50,
  "7JH4t2JAdaX5VSDevkWfFbaxNYXkkJsjTnLgLiCfV2DF": 51,
  "7rXnCPyMYPVy7ybdqyG5D3rcwVkdz1GixCcw83FPK8sP": 52,
  "4THtQELKojVHv8TPya8vjtSfEPoeoACUBqaiyNQrQD8a": 53,
  "8wwhiYpqu99XB2tLi8prxrhBnCB75ePSC4TPYgfv76xK": 54,
  "HVwTVmAC7YwB7YPL95Y6GEYB2mJxK8jEkfi8ibSY9UKK": 55,
  "EgpnUSVhavzoKVZtXLrcwd6nMKeFpdHpcX2BNyENzKVD": 56,
  "5EjqiRSGHsq1KCeK7PZ11r2nyVN3rytdEFxM8cqpxuiU": 57,
  "6L5QmRBLK1SM1jTAuaBT5Hw6w7kVaf4CUDvUxozR5YJf": 58,
  "3TapDRrH84xs1ZQtqLZijzCmvhsijkvaddY9F5QZWxSn": 59,
  "Ad2F6wcV1tFQirJ5aBgraY62vETiPXq8QrdHWragT75k": 60,
  "HhvNoCr5bV8TdBKXuHeHQRm2c7dRCozfHXmMeSxCWrcJ": 61,
  "8GUuxGEJ5muejDz8fTg5Cnf4cWj4ibavMXmvaVZkuaza": 62,
  "Fi1wDnkvAb8mApKqZMxYPxCw92eFRC6YTDnaLVLURfDx": 63,
  "6pYMb8jYfCdoNNoXBRGmY8KLf5fM2bupCWAxswwsoq9Z": 64,
  "FbJedG2GfEg8JmD3P9mPHsetxV4abGMYQNSi4bv6sjtE": 65,
  "8MTDtEQC9oHdK2JvqmbAb6dia2AZSQxuupS5kKtyPJeF": 66,
  "8zZuiFrd3GGt54HQcyJX3q9Z7Yty1szv5oKs4KVtVwCs": 67,
  "8fupVVJUqzqXZVKHCYHnMJpM8d2hZfUwk3JKcUZCwWf4": 68,
  "6wTxKSmSmVYgK957RdzkiPNtjNCM3S83gJrL3itaJgyr": 69,
  "FF9xLXaeSJxzJo9BJyKN8Z3b11B6xu3avF9G9tn5hidv": 70,
  "CHHBf16yS6vdaPSo41yPduAVVtRSbe7D61g3LSvQELqn": 71,
  "AGwbSpF7PYaY6YGcU1qcME3W7RPMaTmGqaLBKavLqWZa": 72,
  "C7puyi9KHn8eZjegvj9dYtcyzjEymvkQJamyYcojn7kt": 73,
  "H8MGr7QdRHAmNYCGZwBVSLTgdEepNvnNqJhVRWWSsdm": 74,
  "7dCcLDGDB58mhU3ac8fUnc8CHxsYCZ3kJAiunKu3QmNk": 75,
  "DzBE6RYuKMftkakR5utFdMeAeMZPAabgGSGWr8YbcBMm": 76,
  "2LdCHSBNAfcuMUfBrPeQF34LqMz7mKRiHVMRYBNStr57": 77,
  "5cQ3AHQiZsJAwPXrwvdvV4repyjQSA5bJQf7A4PxTGDu": 78,
  "9DfGwSiocPHdub3i5jKSmbjiVnJ2gWmYDUreuDhMGcHq": 79,
  "7XWSpKgpjQCek1GiF5QYogDf1fx3nCZjwkWDhufW6KPe": 80,
  "7oMHSRckJtFeYC3VXjdRvAyVanucMiJafdE4TwEj5LGh": 81,
  "2Vb4koxLPkjwttEv6SjFzdJYrxAa8NvtZ2Quv1oW2ui4": 82,
  "EkEDFShqaPQLbkbHnBTfBrHkn7aqTkM4VcBAqCymZqmN": 83,
  "AWGfrytMBxbJqDSiaK45okEoKPoov4qkJUdjLybkYmsk": 84,
  "2K34HL7mDbTda8M72WJsz7Rb219XeKuDp57jpS12vB3J": 85,
  "G2Bgc3C7fMLQPK7LGfiRw9udWXrx6rD5PGsraEvcYrFa": 86,
  "DQ9q7RQqxsTrqvvio3neApNd73CYd5YQkvzkHMk1mZS3": 87,
  "BxmWQn8vRhvp24JZXe1udkdGDsPE78tWAaY6r58PZDRJ": 88,
  "BtLf5pbzUrfNoAh4imo7xDPSoFykHMmc4w57YgGkqJ1x": 89,
  "CsqftWWKyD7TkdsEcVTzSUeTro8Y7UTTd595xS6XtAzb": 90,
  "2tfcKV8MH6bYViW55aUSeUBxMAr8KS76dH7KZwSTMyc2": 91,
  "GSuA9Qps3xNANuokF8mHUEseZWvHijMhBmPT1mx66UBw": 92,
  "8oEnfaSx7nS11mgprnAg3oZFHRBAQB4H4pRwdb8FLLFJ": 93,
  "5ioiwD8syprtokuUohuG4p72mXG7v2TUpnDByVwb5HYm": 94,
  "4bqSBidEstTgAuizLuShAUp8rLAbUkaPQaFnvLCQrye9": 95,
  "BS8hG8pC6VBZDF7HwHTWLanbtfdZMTrCe63g6GUg8sTF": 96,
  "HMcDF3aBoRD98oC14JnoiUCdmwToXWbtpzgPZ8U72PCd": 97,
  "AXr1j2zdfzYD6Fyu7acFYfVW6Vh4vvtvyxz2ZHyJx6Pv": 98,
  "CCgaXzMAesbCi6ZZigWYDxopjVivCEHqq6HReKoWNyb7": 99,
  "CDv139TgWFvmSqFmXA8y8Gu7jir823z72wtSYuxmrrcZ": 100,
  "4jyCFZNtjuQ2dW8fTKj1NiYUMsKEzRdhneodgHuQ5fXM": 5,
  "FpizAhDq6feXyWJz1rui6f2wPd5cNwTutppphA6V3UXv": 5,
  "Hn3LE2XQqodZA79E7ewTWrXqcTRomxQnw62aXLHczTFh": 5,
  "66oUykTQbCzCu3KNQvFD59pu7f55v3pSpdkgrYMNwVg7": 5,
  "6SssUoxn7YWTYnC88jwsfDcLb6Kq18bJVcWVMYwdb3HL": 5,
  "75UTgpD56jVnbeX9dHrvgMmSt6iFPrABiGMfZJdokmb3": 5,
  "6ZC6r5H3tLJBG979M3n8wkJzeGwYvTRnVj8A2vjiyyxE": 5,
  "9BfKguq7dbFhxdCpt7HwzNPdrMbQvudiRi3j5ojBqgHu": 5,
  "GvrBUrhw4xgCZ5Tq6qsWNbQoCArRqM9jBF3McNroTTsA": 5,
  "827kfj4PupFxNssCC8Ue4LoCQpUzFTMzadwxCJbFD26Q": 5,
  "DH9Y2nYYnJ93sa9xsTZ7SM9M9QsAqWfPcPfdfiR6S4bx": 5,
  "7boaKKL2ExcuFYuGtGaw7oPRZRCKb3zgX5QCubmfy7pZ": 5,
  "CqpACFHQGpqDC6D2DU1GckxrvC5MxPxH3LGTurxEYbuM": 5,
  "CvWnW3a5TcAA4R24VWT1hkrfmm8YSeBZHVKfC5VadQ1i": 5,
  "5EYja1sj3cpmMeE78yFb4xVNUp6sWf3RUE3j6tfUkihf": 5,
  "FCcadzqLyeDyNDgwV3zA91PB77M7xvZgsEJy7hLrwozX": 5,
  "FMNq1xbTnLYKC6GhWmXPB3AUUrD1hFreH5MVA7CM5SPG": 5,
  "CGw8xGY9KEHQaizqFjfEJqtLdd9GdJhPHyM6r86ixdyP": 5,
  "2GFZWdDtE2tS7oM2A8pYpFPc9CZWL8WJU2siCHcForoq": 5,
  "Gd9sUjvFztxPvnpJhVZU9p1dJ26mn2Tb9QJB1ZoNUxV5": 5,
  "A3ZW4VxXJdhbBj5iHJ65drmLvkewKnkvWcknCo9PtNRW": 5,
  "64EWVBghx6PedoSPJqrCxVhdGvokWASqyNAexBSEZTUr": 5,
  "nTSGH9SVL9hc6SsQbntUWFDW7i14J6n6TEjGcBRAhXy": 5,
  "FPYvzaXtcDaCaoNg3MBurnZYMjbYjMsidLhPpH5fjQSu": 5,
  "5vBP5eArp4gT97gNYRkVBmZgD1jWyQEBtEsEBRJyifNa": 5,
  "2n46y1m5ManNLRjHsynz7Et9AbNxWvQmWTACEQ4oYKFr": 5,
  "3z3jzf4zsoePKGbyjCLvCDkBNiaLfBNf9kMr14JgS8ZW": 5,
  "5b2jnHgWYKKnsinrTPnFzKYLiXpndW2Sa4L9jmwsqRBA": 5,
  "FBoXJkeh5gezEHLSpEbLdx2CbcQdR7XpMrSEz7MuS9or": 5,
  "BfxwwaBK1tFBz2Dciu7vC8AT7oWGU6Ax325vJm66nvKd": 5,
  "HAphC7H9vPkffKD2Vr3Ym97M6MTeB8ysRRc1RAJWkGFq": 5,
  "4weuvFe8HdhPMMhEku6nwipw67LVKidWxS8JjdRVE9re": 5,
  "8xNuLhenbAu2iXiqfDDrS64D6ba97RczXikRPQt2Gm3a": 5,
  "GDVDCqLjz3o2GpmeFJhg1Ccuzh9TQPxHXpDYiMEZWsrv": 5,
  "B3P9kEvJtJ2v1fEPtdAHH7YgAAXZFugjhtXGT1dQ8cjD": 5,
  "H2B3jwo9NeU3RNM7WeaK4d5fBJV2DizSzjW1v6L3Z4Ls": 5,
  "Aw46ojnLEXLVB6L3mr2FaRozvysUSukk3vvivFf1ByKK": 5,
  "CjFhPU5Rqvbir3bJSw1XT3nwnqpc5w5noSxrxYTp1s5o": 5,
  "HWpNQjYF6efdniB5LWNGQwXLLKpNqy4qxCxfnLp6mXJQ": 5,
  "7jN2bBxoagSSSSYGSmPvopQpxj7asFUGgRTv4bhiXLAT": 5,
  "2JRbxuSTUP5HKAc6RRMMmBAhVxCnGoRvgDt2sReWcMGt": 5,
  "AuMGDATuSqCUickuSwYrQhLKahhi283LuCzuYdTdRf5P": 5,
  "44VdsRmEdj6TXTavJfLgd7uT3ARqcPuqkpxdS3von1fZ": 5,
  "2EAzGdbCQ3PLENLFmp5s9JUxJmHyugpd1C5fLYd19YLS": 5,
  "5QM3ALpdr441FFT4yXPGAKbite5SESdd8px8AcyZk5eJ": 5,
  "EcMATrWyFk1BfHpeTfdbhMj88LkTDzpvdrYq4y6RMhbd": 5,
  "784meXrSQNmE2C6cdsMQYdQkjTZuFff8XizNTXSNpdea": 5,
  "FgGfp7H3JJSLaMZvy9VBGGB7H2T9qgJxaHJDMjPSqR6F": 5,
  "41DwVVaFM9HwoTz7kLYicmfybCuZvueqNoehuSrpVTEK": 5,
  "Gc98o9hkSwVboCd9TVrzj83rqyAkpSp2VpDVGRb7Dpb9": 5,
  "DNpmVZZDWs1FPbz2itpLuHfETotxqz9yAN9JfN42jeX3": 5,
  "8QtRfvC3L2n2ejffiQ9F4rmNkY2yMTtauGEAeTHgJohH": 5,
  "94EvMBKYJdHk9eYhL12qHs6DrJio5zS1aYmNkbDwVEbB": 5,
  "4x4XxqXFTQjzXR9X6h8E82hnrpmhtQTwUtW1SSQrfoXc": 5,
  "ABkr1FS5Dvz1ihbjHuBEL8bFWDNNQDepxGZZWArZEnQ8": 5,
  "5UMGoRQ9uJ76oUTdFLNEvxN1GDMdZ4oqK6yPTMxGaK25": 5,
  "J1DxtBT8AxZ7gGBZyCEacm6B6cRM1BEvU9aR6ELchhq5": 5,
  "HgHvYAfWZ7qmj6MCzcfJjSLGoft4fK3JfiUYzjj51nBR": 5,
  "E484ehLwubALKDdg9kBZ4dqX7eZ4JMkTQ8BMnKRNQ4XN": 5,
  "7Qa7dVmRD49mWU3ZtvcrHKNbnMfC1KRJpHPAehzyweRS": 5,
  "2nWk8tRebf4iWbwwRpcKWQhQgPV8rNVgv47S6D8pEpWL": 5,
  "ATL1MmfSVeU9jDcnvW8SWRfAFUnLMKRarQW4YqurNfo2": 5,
  "Ce3B4mVFpaTZNwoGng8fqBwZPERtS1ps3PKYZrN8HZR9": 5,
  "Ck5VXmPcPasDjb1AX6WXsprkvyqFaxBG5mwymy2LFvFV": 5,
  "2eWDxNVryZcNEUDBw6iqXqYUpu2RMBSCfrkpF9TLBbq7": 5,
  "7DoPrKGGLdnmzhHQjxjQ3EkeNvxePV8HrCTSAc32VxQ2": 5,
  "DK76B2s7uKQKarzW2wKiKpUNPnWiYesA5arUD4XtDbN9": 5,
  "D2ogFmNZtJWK6mTbmpc81y71LDWKCescWnhsqCB3NfFZ": 5,
  "3aRKcNpQ9a2TwCkeFFEVnePNQLC9cHGsGQwYb9v3aeur": 5,
  "Fn5n7qY28DpbHpiYKYr9Xk9V3s5UuK4oZLQL1sFxGpND": 5,
  "3UAnisDHLz4oVDDx6aTw3AHmM19QMQCeSyA3XtMmrujD": 5,
  "7ttumdJ4DqCSQf2bD114hkz2EpQNH2rKSj83P7tqjdxt": 5,
  "4dYN1usjije556jRJzj7qy8bNvPJtqzzm8UVgtR3BH6n": 5,
  "4HjXwWdibXRQvt2YATgvCnMyU5hpuue8VhuDRVgi7Zs3": 5,
  "EhTWp29CBcBbFRJhwgStBmfwGEK9DVCscms9HRAuJbCG": 5,
  "1x8Gb1AWkKQ3YpWQfXEHZy5qh6ns6xdkZsexsy29aC": 5,
  "DCJt5VyL6cPCW4sPgPER83QcMdRSGSKg18bnNVReMrCD": 5,
  "2cxsU5mkHsPGPG8rXWZ6gmzjVJCcFJq9gTMKqDvDALvc": 5,
  "Bfu5yHVvYruhKjhKDDDFAyvRi1658LQipVmrMqxccokR": 5,
  "HypaqNf6ZVfMLP9fcDUu5CJEhgxK5UYYyrv4J79n7SwF": 5,
  "GmW42aXVzxuCw7cFLG7MPw2ThabM5b6bEZ6F1RK4fMNV": 5,
  "6WnSmpsgRAyGWU1bevtEDxLCXyRgZk8EXMkniio4XNP2": 5,
  "6zTt68LEuiMFf6PWgb9YWvZHsuC28xYrxgDTBWpcvZyF": 5,
  "EmAsYqJraBKz8f7Kzh1NLHGmqMSNd4r2QaYykxgDPQgw": 5,
  "BGd2qvfrPsx5k72bWnXgMzm8dvPaby49h9jRuN5ytf3z": 5,
  "F2ih4H2zCEKFE9NYQJWQMTdBVyg8rPxGLqmSmFyVmSRZ": 5,
  "8m2m26Xc4dUjPddcAu18N27gDqe7LEqj779Zy6etzXtk": 5,
  "z5XQTgpFDWpeZrLwNqZsqnkeZeucfFK2JeQEXLvNj7e": 5,
  "2x2LAgkLd7fKhs9k4D946MJp2ETKP1tDnv6MFNVzYXKj": 5,
  "HCNzEvrH7rth895X38WgTHHnJRVr4kESnhVbyBDwHnbF": 5,
  "Ea4ZDbTgSmeJhYt7vkXtdWFpvTDynL7CKiazD6Krc4JU": 5,
  "8cUiEHoKxN2bziLKh1LbVsNgT8dESVn9CdNLBmJxjPxN": 5,
  "E5apFBUnbGyV3eYjGEKiCkQ2auHCo6A4idCqggj9YsuZ": 5,
  "4h3LD394PqFGExm63k1HiuyDkbKY7faY1jDwDbi9ieex": 5,
  "FHcdaEGaxgACZv2KbnvQQNykAojTM1Ukixmc7FxnETTD": 5,
  "2sfbYJpcVrpeVYfM7Zb4ELRyrCAK7n58aZBmYhDrvsuU": 5,
  "DbGk5DtxChxTmEQ3rTZcWdH1zgVppJLwfcd93yuaodny": 5,
  "7T2V37e5Wq7fZk1nrrNMBH1qEE85EhFJq8jCRsiSbJqe": 5,
  "7znCLYGRB1wTkXUv3wm5RqMhEizrciNP8MA8mweHzsKL": 5,
  "2gotqmCh3xU1WThpBuD8URA1WZuVMYM1ynFtbQZYRsK1": 200
}

export const getPubkeyIndex = (pubkey: string) => {
    return pubkeysIndex[pubkey]
}