import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          あなたの「お金の性格」を
          <br />
          <span className="text-blue-600">3分で診断</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          投資？貯金？保険？
          <br />
          本当に合っている方法を見つけよう
        </p>

        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-green-500">✓</span>
            たった10問の質問に答えるだけ
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-green-500">✓</span>
            4つのタイプから最適を診断
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-green-500">✓</span>
            無料でパーソナライズアドバイス
          </div>
        </div>

        <Link
          href="/diagnosis"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
        >
          今すぐ無料診断する
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          ※ 所要時間3分・登録不要
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            診断でわかること
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              title="堅実派"
              description="安全性を重視し、確実な資産形成を目指すタイプ"
              icon="🛡️"
            />
            <FeatureCard
              title="バランス派"
              description="リスクとリターンのバランスを取れるタイプ"
              icon="⚖️"
            />
            <FeatureCard
              title="積極派"
              description="高いリターンを求め、チャレンジするタイプ"
              icon="🚀"
            />
            <FeatureCard
              title="学習派"
              description="これから学び、成長していくタイプ"
              icon="📚"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            まずは自分のタイプを知ることから
          </h2>
          <p className="text-xl mb-8 opacity-90">
            たった3分で、あなたに最適な金融戦略がわかります
          </p>
          <Link
            href="/diagnosis"
            className="inline-block bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors"
          >
            無料診断を始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 お金の診断. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
