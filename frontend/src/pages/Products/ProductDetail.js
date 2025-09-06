import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Product Details
          </h1>
          <p className="text-gray-600">
            Product ID: {id}
          </p>
          <p className="text-gray-600 mt-4">
            This page will display product information and allow adding to cart. Coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
