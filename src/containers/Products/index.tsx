import React, { useEffect, useState } from "react";
import { ProductDto } from "../../models/dtos/product";

import Spinner from "../../components/Spinner";
import Product from "../../components/Product";

import {
  Container,
  TabContainer,
  ProductSearch,
  InputSearchProduct,
  TabItem,
  IconContainer,
  SearchIcon,
  Header,
  Column,
  ProductsContent,
  LoadingContainer,
} from "./styles";

type ProductByCategory = {
  category: string;
  products: ProductDto[];
};

const ProductsContainer: React.FC = () => {
  const [products, setProducts] = useState<ProductByCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const products = await window.Main.product.getProducts();
      const categories = products
        .filter((_product) => _product.product.category.id !== 1)
        .map((_product) => _product.product.category.name)
        .filter((item, pos, self) => self.indexOf(item) == pos);

      const payload = categories.map((_category) => ({
        category: _category,
        products: products.filter(
          (_product) => _product.product.category.name === _category
        ),
      }));
      setProducts(payload);
      setLoading(false);
    }
    init();
  }, []);

  return (
    <Container>
      {loading ? (
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      ) : (
        <TabContainer defaultActiveKey="1">
          {products?.map((productCategory, index) => (
            <TabItem tab={productCategory.category} key={index + 1}>
              <ProductSearch>
                <IconContainer>
                  <SearchIcon />
                </IconContainer>
                <InputSearchProduct placeholder="Procurar item" />
              </ProductSearch>

              <Header>
                <Column sm={11}>Produto</Column>
                <Column sm={8}>Preço</Column>
                <Column sm={5}>Ação</Column>
              </Header>

              <ProductsContent>
                {productCategory.products.map((product) => (
                  <Product key={product.product_id} product={product} />
                ))}
              </ProductsContent>
            </TabItem>
          ))}
        </TabContainer>
      )}
    </Container>
  );
};

export default ProductsContainer;
