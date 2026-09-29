import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Typography, Tag, Spin, Button, Divider } from "antd";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import { articleService } from "@/services/ArticleService";
import type { Article } from "@/types/Article";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await articleService.getById(Number(id));
      setArticle(res.data.data);
    } catch {
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  if (loading || !article) {
    return (
      <Layout className="min-h-screen">
        <div className="flex justify-center items-center h-[60vh]">
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Content>
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Button
            icon={<ArrowLeftOutlined />}
            type="link"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>

          <Title level={2} className="mt-2">
            {article.title}
          </Title>

          <div className="flex items-center gap-4 text-gray-500 mt-2">
            <Tag color={article.category === "Promotion" ? "red" : "blue"}>
              {article.category === "Promotion" ? "Khuyến mãi" : "Điện ảnh"}
            </Tag>
            <span className="flex items-center gap-1">
              <CalendarOutlined />
              {article.createdAt}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full max-h-[420px] object-cover rounded-xl mb-8"
        />

        <Paragraph className="text-lg text-gray-600 font-medium mb-6">
          {article.summary}
        </Paragraph>

        <Divider />

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </Content>
  );
}
