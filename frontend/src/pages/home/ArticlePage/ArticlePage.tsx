import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Tabs,
  Pagination,
  message,
  Spin,
} from "antd";
import { articleService } from "@/services/ArticleService";
import type { Article } from "@/types/Article";
import ArticleCard from "@/components/ArticleCard";

const { Content } = Layout;
const { Title } = Typography;

const ArticlePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await articleService.getActive();
      setArticles(res.data.data || []);
    } catch {
      message.error("Không tải được tin tức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles =
    activeTab === "all"
      ? articles
      : articles.filter(
          (n) =>
            (activeTab === "movie" && n.category === "Movie") ||
            (activeTab === "promotion" && n.category === "Promotion"),
        );

  return (
    <Content>
      <div className="bg-gray-50 py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <Title level={2} className="border-l-4 border-blue-600 pl-4">
            TIN TỨC & ƯU ĐÃI
          </Title>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs
          defaultActiveKey="all"
          onChange={setActiveTab}
          items={[
            { key: "all", label: "Tất cả" },
            { key: "movie", label: "Điện ảnh" },
            { key: "promotion", label: "Khuyến mãi" },
          ]}
          size="large"
          className="mb-8"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[32, 32]}>
            {filteredArticles.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <ArticleCard item={item} />
              </Col>
            ))}
          </Row>
        )}

        <div className="flex justify-center mt-16">
          <Pagination defaultCurrent={1} total={filteredArticles.length} />
        </div>
      </div>
    </Content>
  );
};

export default ArticlePage;
