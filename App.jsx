import React, { useState, useRef, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ===== グローバル設定 =====
const GAS_WEBHOOK_URL = "YOUR_GAS_WEB_APP_URL";
const HUBSPOT_FORM_URL = "https://share.hsforms.com/198usIr1aSyufl0Ks1r2WoQdl1tx";

// ===== 業界別ベンチマーク =====
const INDUSTRY_BENCHMARKS = {
  "IT・ソフトウェア": { I: 72, II: 68, III: 75, IV: 70, V: 68, VI: 65, VII: 72, VIII: 70 },
  "金融・保険": { I: 65, II: 62, III: 58, IV: 72, V: 78, VI: 70, VII: 68, VIII: 62 },
  "製造業": { I: 58, II: 55, III: 52, IV: 65, V: 72, VI: 68, VII: 58, VIII: 55 },
  default: { I: 62, II: 60, III: 62, IV: 65, V: 68, VI: 65, VII: 62, VIII: 60 },
};

// ===== カスタムレンダー関数 =====
const CustomPolarRadiusAxisTick = (props) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#666"
      fontSize="12"
    >
      {payload.value}
    </text>
  );
};

// ===== データ定義 =====
const CATEGORIES = [
  {
    roman: "Ⅰ",
    name: "戦略・方針・施策",
    questions: [
      {
        id: "q1",
        type: "single",
        text: "経営・事業に関する「戦略」や「方針」は明確に策定されていますか？",
        options: [
          "策定され、社内に浸透している",
          "策定しているが、見直しや浸透の余地がある",
          "策定していない・または属人的になっている",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q2",
        type: "single",
        text: "マーケティング・営業の戦略において、ターゲット市場や顧客の分析を事前に行っていますか？",
        options: [
          "定期的に行い、戦略に反映している",
          "過去に行ったが、現在はあまり更新されていない",
          "直感や経験に頼っており、データでの分析は行っていない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q3",
        type: "multi",
        text: "御社の戦略には以下の要素が含まれていますか？（あてはまるものをすべて選択）",
        options: [
          "企業理念やミッションとの明確な整合性",
          "具体的な中期業績目標（数値目標）の定義",
          "デジタルマーケティングや「営業DX」への取り組み方針",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅱ",
    name: "マーケティング・プロモーション",
    questions: [
      {
        id: "q4",
        type: "single",
        text: "プロモーションを実施する際、具体的なターゲット像（ペルソナ）やカスタマージャーニーを定義していますか？",
        options: [
          "明確に定義し、関連部門で共有している",
          "担当者レベルでは意識しているが、組織の共通認識にはなっていない",
          "特に定義していない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q5",
        type: "multi",
        text: "自社のWebサイトやオウンドメディアの運用について、あてはまるものをすべて選択してください。",
        options: [
          "具体的な数値目標（KPI）を定めて運用している",
          "来訪者の動線やアクセスデータを定期的に分析している",
          "来訪者を「リード（見込み顧客）」として管理・育成する仕組みがある",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅲ",
    name: "インサイドセールス",
    questions: [
      {
        id: "q6",
        type: "single",
        text: "インサイドセールス（非対面営業）の専門チームや担当者は設置されていますか？",
        options: [
          "設置し、十分に機能している",
          "設置しているが、成果や運用に課題がある",
          "まだ設置していない（外勤営業が兼任している等）",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q7",
        type: "multi",
        text: "リード（見込み顧客）へのアプローチとして、現在実施している施策はどれですか？",
        options: [
          "ウェビナー・オンライン商談会の開催",
          "ターゲットに合わせたメールマガジンの配信",
          "アウトバウンドコール（架電）によるアプローチ",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q8",
        type: "multi",
        text: "獲得したリードの管理について、あてはまるものをすべて選択してください。",
        options: [
          "リードの温度感をランク付けしている",
          "コールドリードを放置せず、継続的にフォローする仕組みがある",
          "ホットリードを外勤営業へスムーズに引き継ぐルールが整っている",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅳ",
    name: "フィールドセールス",
    questions: [
      {
        id: "q9",
        type: "single",
        text: "提案活動や商談の管理は、現在どのように行っていますか？",
        options: [
          "SFA等のツールで一元管理している",
          "エクセル等で管理しているが、入力の負担や形骸化が起きている",
          "個人の記憶や手帳に依存しており、組織で管理できていない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q10",
        type: "multi",
        text: "案件（商談）の管理について、あてはまるものをすべて選択してください。",
        options: [
          "顧客ごと、案件ごとに受注確度などの「ランク管理」をしている",
          "失注（敗戦）した案件の要因分析を必ず行っている",
          "商談の目的やゴール（マイルストーン）を毎回明確に設定している",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅴ",
    name: "販売管理",
    questions: [
      {
        id: "q11",
        type: "single",
        text: "見積・受注・請求などの販売管理プロセスは、どの程度システム化（電子化）されていますか？",
        options: [
          "ほぼすべて電子化・システム化され、効率的である",
          "一部電子化されているが、紙やハンコの文化も残っている",
          "アナログ（手作業・紙ベース）での作業が中心である",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q12",
        type: "multi",
        text: "販売管理業務について、あてはまるものをすべて選択してください。",
        options: [
          "顧客のアクションをトリガーに自動化されている工程がある",
          "収支計画（採算性）や与信を適切に審査する仕組みがある",
          "見積・受注データが、SFA等と連携されている",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅵ",
    name: "カスタマーサポート",
    questions: [
      {
        id: "q13",
        type: "single",
        text: "顧客からの問い合わせやクレームを一元管理し、関係部署に共有する仕組みはありますか？",
        options: [
          "仕組みがあり、営業やマーケ部門にも迅速に共有されている",
          "仕組みはあるが、サポート部門内に留まりがちである",
          "担当者が個別に対応しており、組織として共有されていない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q14",
        type: "multi",
        text: "顧客満足（CS）の向上について、あてはまるものをすべて選択してください。",
        options: [
          "定期的にCS調査を実施している",
          "調査結果や問い合わせ内容を、商品・サービスの改善に直結させている",
          "問い合わせ対応チャネルごとに数値目標（KPI）がある",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅶ",
    name: "データ分析・データ活用",
    questions: [
      {
        id: "q15",
        type: "single",
        text: "マーケティング・営業・販売・サポートに至る一連の顧客データは、統合して管理されていますか？",
        options: [
          "統合されたデータ基盤があり、一気通貫で分析できる",
          "ツールや部門ごとにデータが分断（サイロ化）されている",
          "そもそもデータの蓄積自体があまりできていない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q16",
        type: "multi",
        text: "データの活用状況について、あてはまるものをすべて選択してください。",
        options: [
          "データの分析結果を、マーケティングや営業の次の施策に生かしている",
          "定型的なデータ集計・分析業務は自動化されている",
          "データ分析を行うための明確な目的が定義されている",
          "あてはまるものは無い",
        ],
      },
    ],
  },
  {
    roman: "Ⅷ",
    name: "CoE（全社推進活動・組織基盤）",
    questions: [
      {
        id: "q17",
        type: "multi",
        text: "営業DX推進において、以下の体制は整備されていますか？（あてはまるものをすべて選択）",
        options: [
          "部門間で情報交換をする場がある",
          "有益な取り組み事例を社内で共有・評価する仕組みがある",
          "営業のIT活用に関する研修・ハンズオン支援がある",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q18",
        type: "multi",
        text: "営業DX推進の社内共有について、あてはまるものをすべて選択してください。",
        options: [
          "部門間で情報交換をする場がある",
          "有益な取り組み事例を社内で共有・評価する仕組みがある",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q19",
        type: "single",
        text: "営業DX推進に向けた「人材育成」を行っていますか？",
        options: [
          "必要な人材タイプを定義し、体系的な育成カリキュラムがある",
          "OJT中心で、体系的な育成計画はない",
          "育成まで手が回っていない",
          "あてはまるものは無い",
        ],
      },
      {
        id: "q20",
        type: "multi",
        text: "営業DX推進の組織体制について、あてはまるものをすべて選択してください。",
        options: [
          "営業DX推進の専任チームまたは責任者が設置されている",
          "経営層から推進活動への予算・リソース配分が明確にされている",
          "営業DX推進の成果指標（KPI）が定義されている",
          "あてはまるものは無い",
        ],
      },
    ],
  },
];

// ===== スコアリング =====
const SINGLE_SCORES = [3, 1, 0, 0];

function scoreCategory(cat, answers) {
  let total = 0;
  cat.questions.forEach((q) => {
    if (q.type === "single") {
      total += SINGLE_SCORES[answers[q.id] ?? 0] || 0;
    } else {
      const selected = answers[q.id] || [];
      total += Math.min(selected.length, 3);
    }
  });
  const max = cat.questions.length * 3;
  return {
    total,
    max,
    pct: max > 0 ? Math.round((total / max) * 100) : 0,
  };
}

function scoreAll(answers) {
  const perCategory = CATEGORIES.map((cat) => ({
    roman: cat.roman,
    name: cat.name,
    ...scoreCategory(cat, answers),
  }));
  const overall = Math.round(
    perCategory.reduce((sum, c) => sum + c.pct, 0) / perCategory.length
  );
  return { perCategory, overall };
}

function getTier(score) {
  if (score >= 75) return "完全DX組織";
  if (score >= 60) return "若干改善の余地あり";
  if (score >= 45) return "改善の余地あり";
  return "大幅に改善の余地あり";
}

function getIndustryAverageScore(benchmark) {
  const scores = Object.values(benchmark);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getCategoryTier(pct) {
  if (pct >= 67) return "high";
  if (pct >= 34) return "mid";
  return "low";
}

// ===== 詳細な考察テキスト =====
const ADVICE = {
  Ⅰ: {
    high: `【戦略・方針・施策】先進レベル
    
経営層が営業DX推進を戦略的に位置づけており、継続的なレビューが行われています。このレベルでは、以下の強みが確認できます：

✓ 企業理念とDX推進の整合性が明確に統一されている
✓ 定期的に戦略を市場・顧客環境に合わせて更新している
✓ 営業DXの必要性が組織全体で共有されている

【次のステップ】
この強みを活かし、以下の具体的な推進を検討してください：
1. KPI の設定（リード獲得数、営業効率、顧客満足度など）
2. 進捗管理のための定期的なチェックイン機会の確保
3. 各部門への目標ブレイクダウン
4. 営業DX投資の ROI 測定フレームワークの構築`,
    mid: `【戦略・方針・施策】発展途上レベル
    
戦略は定義されていますが、営業現場への浸透度にばらつきがあります。以下の課題が考えられます：

✗ 戦略は経営層では共有されているが、営業現場まで浸透していない
✗ 定期的な更新は行われているものの、関連部門との連携が弱い
✗ デジタルマーケティングの方針は定義されているが、実装段階で課題がある

【改善提案】
1. 経営方針を営業現場レベルに落とし込むワークショップを実施
2. 定期的な啓発活動（月次勉強会など）で意識統一
3. 部門間の情報共有チャネルを強化（会議体の整備）
4. 営業DXの成功事例を社内で共有し、理解を深める`,
    low: `【戦略・方針・施策】基盤構築レベル
    
戦略・方針の明確化が優先課題です。現状の課題：

✗ 営業DXの必要性や目標が組織内で明文化されていない
✗ 経営層と営業現場の間に意識のズレがある
✗ 対症療法的な対応が多く、長期的な戦略がない

【推奨される即時対応】
1. 経営層主導で営業DXの戦略を策定（3～6ヶ月プロジェクト）
2. 市場調査・顧客分析に基づいた目標設定
3. 戦略ドキュメント化と全社共有（経営説明会の開催）
4. 営業DX推進のための専任チーム立ち上げ
5. 短期目標（6ヶ月）と中期目標（1～2年）の設定`
  },
  Ⅱ: {
    high: `【マーケティング・プロモーション】先進レベル
    
ターゲット設定とペルソナ定義が組織的に実施され、効果測定も行われています。強み：

✓ ペルソナが詳細に定義され、営業・マーケ全体で共有
✓ カスタマージャーニーに基づいた施策設計
✓ Webサイト・オウンドメディアに具体的なKPI設定
✓ 定期的なアクセス分析と施策改善

【次のステップ】
1. セグメンテーションの精度をさらに高める（業種・規模別など）
2. ABテストによる最適化の実施
3. パーソナライゼーション施策の検討
4. マーケティングオートメーション（MA）の活用
5. 営業とマーケの連携強化`,
    mid: `【マーケティング・プロモーション】発展途上レベル
    
ペルソナ意識はありますが、関連部門との連携が弱いのが課題です。

✗ 営業とマーケの間でペルソナ定義に相違
✗ Webサイトのデータがマーケだけで共有される（営業に届かない）
✗ リード情報が営業に渡されるまでに時間がかかる

【改善提案】
1. 営業・マーケ合同でペルソナを再定義
2. 定期的な情報共有ミーティング（月1回程度）
3. Webサイトのアクセス・行動データを営業で可視化
4. リード情報の営業への引き継ぎプロセスを標準化
5. マーケティングオートメーション導入を検討`,
    low: `【マーケティング・プロモーション】基盤構築レベル
    
ペルソナやカスタマージャーニーの定義が不足しています。

✗ マーケティング施策が属人的・施当たり的
✗ 顧客理解が不十分で、メッセージのズレが発生
✗ Webサイトの設計が曖昧で、反応率が低い

【推奨される即時対応】
1. 顧客インタビューを実施し、ペルソナ定義から着手（理想の顧客像を明確化）
2. カスタマージャーニー図を作成（認知→検討→購買までの過程）
3. Webサイトリニューアルの検討（ペルソナに合わせた情報設計）
4. マーケとセールスの定期的な連携ミーティング開始
5. マーケティング効果の測定指標（KPI）を設定`
  },
  Ⅲ: {
    high: `【インサイドセールス】先進レベル
    
インサイドセールスの専門チームが機能しており、リード管理も体系的です。強み：

✓ 専任のインサイドセールスチームが組成・運営されている
✓ リードの温度感（ランク付け）が定量的に管理されている
✓ コールドリードへの継続的なフォローアップ体制が確立
✓ ホットリード→外勤営業への引き継ぎルールが明確

【次のステップ】
1. リードスコアリング精度の向上（属性+行動データ活用）
2. インサイドセールス向けツール（SFA/CRM）の導入・最適化
3. 外勤営業との連携強化（定期ミーティング）
4. 離脱リードの分析と再獲得戦略
5. インサイドセールス人員のスキル育成・研修`,
    mid: `【インサイドセールス】発展途上レベル
    
インサイドセールス機能は立ち上がっていますが、成果・運用に課題があります。

✗ チーム設置はされているが、適切なツール・プロセスが不足
✗ リード管理の方法が明確でなく、抜け漏れが発生
✗ 外勤営業との連携が弱く、引き継ぎがスムーズでない
✗ インサイドセールス人員のスキルばらつき

【改善提案】
1. リード管理プロセスの標準化（SFA導入など）
2. リードの温度感を「温・中温・冷」など明確に定義
3. インサイドセールス→外勤営業への引き継ぎ基準を明文化
4. 週次の成果確認ミーティング実施
5. 各メンバーのスキル診断と研修計画`,
    low: `【インサイドセールス】基盤構築レベル
    
インサイドセールス機能が整備されていないのが現状です。

✗ インサイドセールスの専門チームが存在しない
✗ リード情報が放置されたままになっている
✗ 外勤営業が対応できないリードを有効活用できていない
✗ デジタルでの顧客アプローチが十分でない

【推奨される即時対応】
1. インサイドセールスの立ち上げ計画を策定（人員・ツール・プロセス）
2. ウェビナーやメールキャンペーンなどの施策を開始
3. 既存リード情報の棚卸しと優先順位付け
4. 簡易的なリード管理表（ExcelやSpreadsheet）の運用開始
5. 小規模から始めて、成功モデルを確立`
  },
};

// ===== メインコンポーネント =====
export default function App() {
  const [stage, setStage] = useState("start");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [lead, setLead] = useState({
    company: "",
    name: "",
    email: "",
    industry: "",
  });
  const [leadErrors, setLeadErrors] = useState({});
  const [result, setResult] = useState(null);
  const [gasStatus, setGasStatus] = useState({ type: "", message: "" });
  const pdfRef = useRef(null);

  const goNext = () => {
    const cat = CATEGORIES[stepIndex];
    const unansweredQuestions = [];

    cat.questions.forEach((q, qIdx) => {
      const isAnswered = q.type === "single"
        ? answers[q.id] !== undefined && answers[q.id] !== null
        : answers[q.id] && answers[q.id].length > 0;

      if (!isAnswered) {
        unansweredQuestions.push(qIdx + 1);
      }
    });

    if (unansweredQuestions.length > 0) {
      const questionNumbers = unansweredQuestions.join("、");
      setErrorMessage(`未回答の設問があります。\n\n未回答：第${questionNumbers}問\n\nすべての質問にお答えください。`);
      return;
    }

    setErrorMessage("");

    if (stepIndex < CATEGORIES.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setStage("lead");
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      setStage("start");
    }
  };

  const selectOption = (qId, idx, type) => {
    setErrorMessage("");
    
    if (type === "single") {
      setAnswers({ ...answers, [qId]: idx });
    } else {
      const selected = answers[qId] || [];
      if (selected.includes(idx)) {
        setAnswers({
          ...answers,
          [qId]: selected.filter((i) => i !== idx),
        });
      } else {
        setAnswers({ ...answers, [qId]: [...selected, idx] });
      }
    }
  };

  const submitLead = () => {
    const errs = {};
    if (!lead.company.trim()) errs.company = "会社名を入力してください";
    if (!lead.name.trim()) errs.name = "氏名を入力してください";
    if (!lead.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errs.email = "有効なメールアドレスを入力してください";
    }

    if (Object.keys(errs).length > 0) {
      setLeadErrors(errs);
      return;
    }

    const res = scoreAll(answers);
    const benchmark = INDUSTRY_BENCHMARKS[lead.industry] || INDUSTRY_BENCHMARKS.default;
    const industryAvgScore = getIndustryAverageScore(benchmark);
    setResult({ ...res, ...lead, benchmark, industryAvgScore });
    setStage("result");
    setLeadErrors({});
  };

  const submitToGAS = async () => {
    if (!result) return;
    setGasStatus({ type: "loading", message: "送信中..." });

    try {
      const payload = {
        name: result.name,
        email: result.email,
        company: result.company,
        industry: result.industry,
        overall: result.overall,
        tier: getTier(result.overall),
        categoryI: result.perCategory[0]?.pct || 0,
        categoryII: result.perCategory[1]?.pct || 0,
        categoryIII: result.perCategory[2]?.pct || 0,
        categoryIV: result.perCategory[3]?.pct || 0,
        categoryV: result.perCategory[4]?.pct || 0,
        categoryVI: result.perCategory[5]?.pct || 0,
        categoryVII: result.perCategory[6]?.pct || 0,
        categoryVIII: result.perCategory[7]?.pct || 0,
      };

      await fetch(GAS_WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        mode: "no-cors",
      });

      setGasStatus({
        type: "success",
        message: "✅ 診断結果がスプレッドシートに保存されました",
      });
    } catch (error) {
      setGasStatus({
        type: "error",
        message: "❌ スプレッドシート保存に失敗しました",
      });
      console.error("GAS Error:", error);
    }
  };

  // ★修正箇所：特注サイズのPDFで下まで全部出力する機能
  const downloadPDF = () => {
    if (!pdfRef.current || !result) return;
    const target = pdfRef.current; 
    
    html2canvas(target, { 
      scale: 2, 
      useCORS: true,
      scrollY: -window.scrollY // スクロールによる見切れを防止
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdfWidth = 210; // 横幅はA4サイズ(210mm)を維持
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // 画像の比率に合わせて縦幅を計算
      
      // A4ではなく「pdfWidth × pdfHeight」の特注サイズPDFを作成
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result.company}_営業DX診断_${result.overall}点.pdf`); 
    });
  };

  const styles = {
    container: "max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen",
    card: "bg-white rounded-lg shadow-lg p-8 mb-6",
    button: "px-6 py-3 rounded-lg font-semibold transition-all",
    btnPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    btnSecondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    input: "w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2",
    error: "text-red-600 text-sm mt-1",
  };

  // ===== START SCREEN =====
  if (stage === "start") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">📊 営業DX成熟度診断</h1>
            <p className="text-lg text-gray-600 mb-8">
              8つのカテゴリー・20問で、あなたの営業DX成熟度を診断します
            </p>
            <button className={`${styles.button} ${styles.btnPrimary}`} onClick={() => setStage("quiz")}>
              診断を開始する →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== QUIZ SCREEN =====
  if (stage === "quiz") {
    const cat = CATEGORIES[stepIndex];
    const progress = ((stepIndex + 1) / CATEGORIES.length) * 100;

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-semibold text-blue-600">
                {cat.roman}. {cat.name}
              </span>
              <span>
                {stepIndex + 1} / {CATEGORIES.length}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {cat.questions.map((q, qIdx) => (
            <div key={q.id} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {qIdx + 1}. {q.text}
              </h3>
              <div>
                {q.options.map((opt, optIdx) => {
                  const isSelected =
                    q.type === "single"
                      ? answers[q.id] === optIdx
                      : (answers[q.id] || []).includes(optIdx);

                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectOption(q.id, optIdx, q.type)}
                      className={`w-full text-left p-4 mb-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 bg-white hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 mr-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"
                          }`}
                        >
                          {isSelected && <span className="text-white text-sm">✓</span>}
                        </div>
                        <span className={isSelected ? "font-semibold text-blue-600" : "text-gray-700"}>
                          {opt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {errorMessage && (
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold whitespace-pre-wrap text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button className={`${styles.button} ${styles.btnSecondary} flex-1`} onClick={goBack}>
              ← {stepIndex > 0 ? "前へ" : "キャンセル"}
            </button>
            <button className={`${styles.button} ${styles.btnPrimary} flex-1`} onClick={goNext}>
              {stepIndex === CATEGORIES.length - 1 ? "リード入力へ →" : "次へ →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== LEAD SCREEN =====
  if (stage === "lead") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">リード情報の入力</h2>

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            会社名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="○○会社"
            value={lead.company}
            onChange={(e) => setLead({ ...lead, company: e.target.value })}
          />
          {leadErrors.company && <div className={styles.error}>{leadErrors.company}</div>}

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="山田太郎"
            value={lead.name}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
          />
          {leadErrors.name && <div className={styles.error}>{leadErrors.name}</div>}

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className={styles.input}
            placeholder="yamada@example.com"
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
          />
          {leadErrors.email && <div className={styles.error}>{leadErrors.email}</div>}

          <label className="block text-sm font-semibold text-gray-700 mb-2">業種</label>
          <select
            className={styles.input}
            value={lead.industry}
            onChange={(e) => setLead({ ...lead, industry: e.target.value })}
          >
            <option value="">選択してください</option>
            <option>IT・ソフトウェア</option>
            <option>金融・保険</option>
            <option>製造業</option>
            <option>その他</option>
          </select>

          <div className="flex gap-4 mt-8">
            <button
              className={`${styles.button} ${styles.btnSecondary} flex-1`}
              onClick={() => {
                setStepIndex(CATEGORIES.length - 1);
                setStage("quiz");
              }}
            >
              ← 戻る
            </button>
            <button className={`${styles.button} ${styles.btnPrimary} flex-1`} onClick={submitLead}>
              結果を見る →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULT SCREEN =====
  if (stage === "result" && result) {
    const chartData = result.perCategory.map((cat, idx) => ({
      name: cat.roman,
      fullName: `${cat.roman} ${cat.name}`,
      "スコア": cat.pct,
      "同業種平均": result.benchmark[Object.keys(result.benchmark)[idx]] || 60,
    }));

    return (
      <div className={styles.container}>
        {gasStatus.message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              gasStatus.type === "success"
                ? "bg-green-100 text-green-800"
                : gasStatus.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {gasStatus.message}
          </div>
        )}

        <div className="bg-blue-100 rounded-lg p-6 mb-6">
          <p className="text-center font-semibold text-blue-800 mb-4">📥 結果をダウンロード</p>
          <div className="flex gap-3 justify-center">
            <button 
              className={`${styles.button} ${styles.btnPrimary}`} 
              onClick={downloadPDF}
            >
              📄 PDF をダウンロード
            </button>
          </div>
        </div>

        <div className={styles.card} ref={pdfRef}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">営業DX成熟度診断</h2>
            <p className="text-lg text-gray-600 mb-6">{result.company}様 - 診断結果報告</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-8">
                <p className="text-sm text-gray-600 mb-2">貴社のスコア</p>
                <div className="text-5xl font-bold text-blue-600 mb-2">{result.overall}</div>
                <p className="text-gray-600 mb-4">/ 100</p>
                <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full font-semibold text-sm">
                  {getTier(result.overall)}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-8">
                <p className="text-sm text-gray-600 mb-2">同業種平均スコア</p>
                <div className="text-5xl font-bold text-orange-600 mb-2">{result.industryAvgScore}</div>
                <p className="text-gray-600 mb-4">/ 100</p>
                <div className="text-sm text-gray-600 font-semibold">
                  {result.industry || "選択なし"}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-center text-sm text-gray-600 mb-4">
              青線：貴社のスコア ｜ オレンジ線：同業種平均
            </p>
            <ResponsiveContainer width="100%" height={450}>
              <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "#4b5563", fontSize: 13, fontWeight: "bold" }}
                  angle={90}
                  orientation="outer"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={<CustomPolarRadiusAxisTick />}
                />
                <Radar
                  name="貴社"
                  dataKey="スコア"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.6}
                />
                <Radar
                  name="同業種平均"
                  dataKey="同業種平均"
                  stroke="#ff9800"
                  fill="#ff9800"
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">カテゴリー別スコア</h3>
            {result.perCategory.map((cat, idx) => {
              const benchmark = result.benchmark[Object.keys(result.benchmark)[idx]] || 60;
              return (
                <div key={cat.roman} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {cat.roman}. {cat.name}
                      </span>
                      <span className="ml-4 text-sm text-gray-600">
                        同業種平均: {benchmark}点
                      </span>
                    </div>
                    <span className="text-blue-600 font-bold">{cat.pct}点</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3 relative">
                    <div className="absolute h-3 rounded-full bg-blue-600" style={{ width: `${cat.pct}%` }}></div>
                    <div
                      className="absolute h-1 bg-orange-500 top-1"
                      style={{ left: `${benchmark}%`, width: "2px" }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">考察と改善提案</h3>
            {result.perCategory.map((cat, idx) => {
              const tier = getCategoryTier(cat.pct);
              const advice = ADVICE[cat.roman] ? ADVICE[cat.roman][tier] : "";
              const isBlurred = idx >= 3;

              return (
                <div
                  key={cat.roman}
                  className={`bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded ${
                    isBlurred ? "opacity-50 select-none" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-semibold text-gray-700 text-lg">
                      {cat.roman}. {cat.name}
                    </span>
                    {isBlurred && <Eye className="text-gray-400" size={20} />}
                  </div>
                  {isBlurred ? (
                    <p className="text-gray-400 blur-sm">
                      より詳細な診断結果をご希望の場合は、お問い合わせください
                    </p>
                  ) : (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {advice}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-amber-900 mb-3">
              💼 <strong>本格的な診断（全300項目）にご興味がある方は</strong>
            </p>
            <a
              href={HUBSPOT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.button} ${styles.btnPrimary} inline-flex items-center gap-2`}
            >
              <Mail size={18} />
              お問い合わせフォームへ
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            className={`${styles.button} ${styles.btnSecondary}`}
            onClick={() => {
              setStage("start");
              setStepIndex(0);
              setAnswers({});
              setLead({ company: "", name: "", email: "", industry: "" });
              setResult(null);
            }}
          >
            🔄 もう一度診断する
          </button>
        </div>
      </div>
    );
  }

  return null;
}