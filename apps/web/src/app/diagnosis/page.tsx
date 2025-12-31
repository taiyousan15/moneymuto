'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 診断質問（本番ではconfigから読み込み）
const questions = [
  {
    id: 'q1',
    text: 'ボーナスが入ったら、まず何をしますか？',
    options: [
      { id: 'q1_a', text: 'すぐに銀行の定期預金に入れる' },
      { id: 'q1_b', text: '投資信託や株式を購入する' },
      { id: 'q1_c', text: '半分は貯金、半分は投資' },
      { id: 'q1_d', text: 'よくわからないのでそのまま普通預金に' },
    ],
  },
  {
    id: 'q2',
    text: '「投資」という言葉を聞いて、最初に思い浮かぶイメージは？',
    options: [
      { id: 'q2_a', text: 'お金が減るかもしれない怖いもの' },
      { id: 'q2_b', text: 'お金を増やすためのツール' },
      { id: 'q2_c', text: 'リスクもあるが将来のために必要なこと' },
      { id: 'q2_d', text: '正直よくわからない' },
    ],
  },
  // 残りの質問は省略（本番ではconfigから全て読み込み）
];

export default function DiagnosisPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleAnswer = (optionId: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 全問回答完了 → 結果送信
      submitDiagnosis(newAnswers);
    }
  };

  const submitDiagnosis = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(finalAnswers).map(([questionId, optionId]) => ({
            questionId,
            optionId,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('診断の送信に失敗しました');
      }

      const result = await response.json();
      router.push(`/result/${result.id}`);
    } catch (error) {
      console.error('Diagnosis error:', error);
      alert('エラーが発生しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isSubmitting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">診断結果を計算中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>質問 {currentIndex + 1} / {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  answers[currentQuestion.id] === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </main>
  );
}
