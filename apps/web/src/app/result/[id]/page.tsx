import Link from 'next/link';

// 仮のタイプ情報（本番ではDBから取得）
const typeInfo: Record<string, { name: string; icon: string; color: string; advice: string[] }> = {
  conservative: {
    name: '堅実派',
    icon: '🛡️',
    color: 'blue',
    advice: [
      '定期預金だけでなく、個人向け国債も検討してみましょう',
      'インフレリスクを意識して、資産の一部は運用に回すことも大切です',
      'つみたてNISAは少額から始められる低リスクな選択肢です',
    ],
  },
  balanced: {
    name: 'バランス派',
    icon: '⚖️',
    color: 'green',
    advice: [
      '分散投資の考え方は正しいです。さらに効率的な配分を学びましょう',
      '定期的なリバランスで資産配分を維持することが重要です',
      '目標に合わせたポートフォリオ設計を検討しましょう',
    ],
  },
  aggressive: {
    name: '積極派',
    icon: '🚀',
    color: 'red',
    advice: [
      'リスク管理も投資の重要な要素です。損切りラインを決めておきましょう',
      'レバレッジ商品には特に注意が必要です',
      '長期投資の観点も持つと、より安定した成果が期待できます',
    ],
  },
  learner: {
    name: '学習派',
    icon: '📚',
    color: 'purple',
    advice: [
      'まずは金融の基礎用語を理解することから始めましょう',
      '少額からつみたてNISAを始めて、実践しながら学ぶのがおすすめです',
      '信頼できる情報源を見つけて、定期的に学習する習慣をつけましょう',
    ],
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;

  // 仮のデータ（本番ではAPIから取得）
  const result = {
    id,
    type: 'balanced',
    typeName: 'バランス派',
    scores: {
      safety: 55,
      growth: 60,
      knowledge: 50,
      action: 55,
    },
    linkCode: 'A1B2C3D4',
  };

  const info = typeInfo[result.type];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Result Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
          <div className="text-6xl mb-4">{info.icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            あなたは「{info.name}」タイプ
          </h1>
          <p className="text-gray-600">
            リスクとリターンのバランスを取れるあなた
          </p>
        </div>

        {/* Scores */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">スコア詳細</h2>
          <div className="space-y-4">
            <ScoreBar label="安全性" value={result.scores.safety} color="blue" />
            <ScoreBar label="成長性" value={result.scores.growth} color="green" />
            <ScoreBar label="金融知識" value={result.scores.knowledge} color="yellow" />
            <ScoreBar label="行動力" value={result.scores.action} color="purple" />
          </div>
        </div>

        {/* Advice */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">アドバイス</h2>
          <ul className="space-y-3">
            {info.advice.map((advice, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-gray-700">{advice}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* LINE CTA */}
        <div className="bg-green-500 rounded-xl shadow-lg p-6 text-white text-center">
          <h2 className="text-xl font-bold mb-2">
            🎁 LINE登録で特典プレゼント
          </h2>
          <p className="mb-4 opacity-90">
            あなた専用の詳細レポートと
            <br />
            10日間の無料メールコースをお届け！
          </p>

          <a
            href="https://line.me/R/ti/p/@your_line_id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors mb-4"
          >
            LINE友だち追加
          </a>

          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm mb-1">📱 コードをLINEに送信してください</p>
            <p className="text-2xl font-mono font-bold">{result.linkCode}</p>
          </div>
        </div>

        {/* Back to Top */}
        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 hover:underline">
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
