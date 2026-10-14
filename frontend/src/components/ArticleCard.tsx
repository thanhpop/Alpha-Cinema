import { useNavigate } from "react-router-dom";
import { Card, Tag, Typography } from "antd";
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import type { Article } from "@/types/Article";

const { Title, Paragraph } = Typography;

const ArticleCard: React.FC<{ item: Article }> = ({ item }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      className="h-full shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden"
      cover={
        <div className="h-48 overflow-hidden relative group">
          <img
            alt={item.title}
            src={item.imageUrl}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-2 left-2">
            <Tag color={item.category === "Promotion" ? "red" : "blue"}>
              {item.category === "Promotion" ? "Khuyến mãi" : "Điện ảnh"}
            </Tag>
          </div>
        </div>
      }
      onClick={() => navigate(`/articles/${item.id}`)}
    >
      <div className="flex flex-col h-full">
        <Title level={5} className="line-clamp-2 mb-2">
          {item.title}
        </Title>

        <div className="text-xs text-gray-400 mb-3">
          <CalendarOutlined className="mr-1" />
          {item.createdAt}
        </div>

        <Paragraph className="text-gray-500 text-sm line-clamp-3 flex-grow">
          {item.summary}
        </Paragraph>

        <div className="text-blue-600 font-semibold text-sm flex items-center mt-3">
          Xem chi tiết <ArrowRightOutlined className="ml-1" />
        </div>
      </div>
    </Card>
  );
};

export default ArticleCard;
