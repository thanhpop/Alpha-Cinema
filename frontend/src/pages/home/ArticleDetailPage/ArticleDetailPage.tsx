import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Typography, Tag, Spin, Button, Divider, Row, Col } from "antd";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import { articleService } from "@/services/ArticleService";
import type { Article } from "@/types/Article";
import ArticleCard from "@/components/ArticleCard";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const OTHER_ARTICLES_LIMIT = 3;

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [otherArticles, setOtherArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await articleService.getById(Number(id));
      setArticle(res.data.data);
      fetchOtherArticles(res.data.data);
    } catch {
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherArticles = async (current: Article) => {
    try {
      const res = await articleService.getActive();
      const others = (res.data.data || []).filter((a) => a.id !== current.id);
      const sameCategory = others.filter((a) => a.category === current.category);
      const rest = others.filter((a) => a.category !== current.category);
      setOtherArticles([...sameCategory, ...rest].slice(0, OTHER_ARTICLES_LIMIT));
    } catch {
      setOtherArticles([]);
    }
  };

  useEffect(() => {
    if (id) {
      window.scrollTo({ top: 0 });
      fetchDetail();
    }
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

        {otherArticles.length > 0 && (
          <div className="mt-16">
            <Title level={3} className="border-l-4 border-blue-600 pl-4 mb-6">
              Bài viết khác
            </Title>
            <Row gutter={[24, 24]}>
              {otherArticles.map((item) => (
                <Col xs={24} sm={12} lg={8} key={item.id}>
                  <ArticleCard item={item} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </Content>
  );
}
