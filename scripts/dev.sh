#!/bin/bash
set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}🚀 Money Onboarding 開発環境セットアップ${NC}"
echo ""

# 環境変数チェック
check_env() {
    echo -e "${YELLOW}📋 環境変数チェック中...${NC}"

    local missing=()

    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${YELLOW}⚠️  .envファイルが見つかりません。.env.exampleからコピーします...${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}✅ .envファイルを作成しました。必要な値を設定してください。${NC}"
    fi

    source "$PROJECT_ROOT/.env"

    [ -z "$DATABASE_URL" ] && missing+=("DATABASE_URL")
    [ -z "$LINE_CHANNEL_SECRET" ] && missing+=("LINE_CHANNEL_SECRET")
    [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ] && missing+=("LINE_CHANNEL_ACCESS_TOKEN")

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}❌ 以下の環境変数が未設定です:${NC}"
        for var in "${missing[@]}"; do
            echo "   - $var"
        done
        echo ""
        echo -e "${YELLOW}💡 .envファイルを編集して設定してください${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 環境変数OK${NC}"
}

# 依存関係インストール
install_deps() {
    echo -e "${YELLOW}📦 依存関係をインストール中...${NC}"

    cd "$PROJECT_ROOT"

    # pnpmがインストールされているか確認
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}pnpmがインストールされていません。npmでインストールします...${NC}"
        npm install -g pnpm
    fi

    pnpm install

    echo -e "${GREEN}✅ 依存関係のインストール完了${NC}"
}

# データベースセットアップ
setup_db() {
    echo -e "${YELLOW}🗄️  データベースをセットアップ中...${NC}"

    cd "$PROJECT_ROOT/db"

    # Prismaクライアント生成
    npx prisma generate

    # マイグレーション実行
    npx prisma migrate dev --name init

    # シードデータ投入（開発用）
    if [ "$1" == "--seed" ]; then
        echo -e "${YELLOW}🌱 シードデータを投入中...${NC}"
        npx tsx ../db/seed.ts
    fi

    echo -e "${GREEN}✅ データベースセットアップ完了${NC}"
}

# 開発サーバー起動
start_dev() {
    echo -e "${YELLOW}🖥️  開発サーバーを起動中...${NC}"

    cd "$PROJECT_ROOT"

    # 並列でwebとworkerを起動
    pnpm run dev
}

# ヘルプ
show_help() {
    echo "使用方法: ./dev.sh [コマンド]"
    echo ""
    echo "コマンド:"
    echo "  check    環境変数をチェック"
    echo "  install  依存関係をインストール"
    echo "  db       データベースをセットアップ"
    echo "  db:seed  データベースをセットアップしてシードデータを投入"
    echo "  start    開発サーバーを起動"
    echo "  all      すべてのセットアップを実行"
    echo "  help     このヘルプを表示"
    echo ""
}

# メイン処理
case "${1:-all}" in
    check)
        check_env
        ;;
    install)
        install_deps
        ;;
    db)
        setup_db
        ;;
    db:seed)
        setup_db --seed
        ;;
    start)
        start_dev
        ;;
    all)
        check_env
        install_deps
        setup_db --seed
        echo ""
        echo -e "${GREEN}🎉 セットアップ完了！${NC}"
        echo ""
        echo -e "開発サーバーを起動するには:"
        echo -e "  ${BLUE}./scripts/dev.sh start${NC}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ 不明なコマンド: $1${NC}"
        show_help
        exit 1
        ;;
esac
