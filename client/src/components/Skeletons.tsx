import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';

export function ArticleSkeleton() {
  return (
    <div style={{ padding: '0 0 16px' }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
}

export function CardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={24} sm={12} md={8} lg={8} xl={6}>
          <Card
            cover={
              <Skeleton.Image
                active
                style={{ width: '100%', height: 180 }}
              />
            }
          >
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function TripDetailSkeleton() {
  return (
    <div>
      <Skeleton.Button active style={{ width: 200, marginBottom: 16 }} />
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div style={{ maxWidth: 600 }}>
      <Skeleton.Button active style={{ width: 150, marginBottom: 24 }} />
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={8}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Skeleton.Avatar active size={80} style={{ marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </Col>
    </Row>
  );
}