import React, { SetStateAction, Dispatch, useState } from "react";

import StockAuditList from "../../containers/StockAuditList";

import { Page } from "../../models/dtos/page";
import { ProductDto } from "../../models/dtos/product";

import Table from "../Table";
import { Modal, message, Dropdown, Menu } from "antd";

import {
  Container,
  Tupla,
  Col,
  LabelName,
  Actions,
  MoreInfo,
  Status,
  EditInfo,
  Input,
  UpdateContainer,
  QtdCurrent,
  QtdChange,
  InputChange,
  Footer,
  ButtonCancel,
  ButtonSave,
} from "./styles";

const { confirm } = Modal;

interface IProps {
  products: ProductDto[];
  filteredProducts: ProductDto[];
  setLoading: Dispatch<SetStateAction<boolean>>;
  setProductsStock: Dispatch<SetStateAction<ProductDto[]>>;
  loading: boolean;
}

const StockList: React.FC<IProps> = ({
  products,
  filteredProducts,
  loading,
  setLoading,
  setProductsStock,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(
    null
  );
  const [newQuantity, setNewQuantity] = useState<number | undefined>(undefined);
  const [paginate, setPaginate] = useState<Page>({
    page: 1,
    size: 10,
    totalElements: 0,
  });

  const header = [
    {
      sm: 5,
      xs: 0,
      description: "Imagem",
    },
    {
      sm: 5,
      xs: 12,
      description: "Produto",
    },
    {
      sm: 5,
      xs: 6,
      description: "Qtd.",
    },

    {
      sm: 5,
      xs: 0,
      description: "Status",
    },
    {
      sm: 4,
      xs: 6,
      description: "Ações",
    },
  ];

  const getQuatity = (quantity?: number): string => {
    if (quantity <= 0 || !quantity) {
      return "Esgotado";
    }
    if (quantity <= 3) {
      return "Estoque baixo";
    }
    return "";
  };

  const handleUpdateProduct = async () => {
    confirm({
      title: "Atualizar Produto",
      content: "Gostaria de prosseguir com a atualização deste produto?",
      okText: "Sim",
      okType: "default",
      cancelText: "Não",
      async onOk() {
        setLoading(true);
        setIsModalVisible(false);
        await window.Main.product.updateProductStock(
          selectedProduct?.id,
          (+selectedProduct?.quantity || 0) - (newQuantity || 0)
        );
        if (products) {
          const productIndex = products.findIndex(
            (product) => product.id === selectedProduct?.id
          );

          const newProduct = products;
          newProduct[productIndex].quantity =
            (+selectedProduct?.quantity || 0) - (newQuantity || 0);
          setProductsStock([...newProduct]);
          setSelectedProduct(null);
          setLoading(false);
          message.success("Produto atualizado com sucesso!");
        } else {
          message.error("Erro ao atualizar produto!");
        }
      },
      onCancel() {
        setIsModalVisible(false);
      },
    });
  };

  return (
    <Container>
      <Table header={header} loading={loading}>
        {(filteredProducts || products).map((storeProduct) => (
          <Tupla align="middle" key={`${storeProduct.id}`}>
            <Col sm={5} xs={0}>
              <LabelName>Imagem</LabelName>
            </Col>
            <Col sm={5} xs={12}>
              <LabelName>{storeProduct.product?.name}</LabelName>
            </Col>
            <Col sm={5} xs={6} style={{ textAlign: "center" }}>
              <LabelName>{storeProduct.quantity}</LabelName>
            </Col>
            <Col sm={5} xs={0}>
              <Status quantity={storeProduct?.quantity}>
                {getQuatity(storeProduct?.quantity)}
              </Status>
            </Col>
            <Col sm={4} xs={6}>
              <Actions>
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        onClick={() => {
                          setNewQuantity(undefined);
                          setIsModalVisible(true);
                          setSelectedProduct(storeProduct);
                        }}
                      >
                        Editar
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                          setPaginate((oldValues) => ({
                            ...oldValues,
                            page: 1,
                            size: 10,
                          }));
                          setSelectedProduct(storeProduct);
                          setVisible(true);
                        }}
                      >
                        Histórico
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={["click"]}
                  placement="bottomLeft"
                >
                  <MoreInfo />
                </Dropdown>
              </Actions>
            </Col>
          </Tupla>
        ))}
      </Table>
      <Modal
        title="Editar"
        visible={isModalVisible}
        centered
        closable={false}
        footer={
          <Footer>
            <ButtonCancel onClick={() => setIsModalVisible(false)}>
              Cancelar
            </ButtonCancel>
            <ButtonSave onClick={() => handleUpdateProduct()}>
              Salvar alteração
            </ButtonSave>
          </Footer>
        }
      >
        <UpdateContainer>
          <QtdCurrent>
            <EditInfo>Quantidade atual:</EditInfo>
            <Input type="number" disabled value={selectedProduct?.quantity} />
          </QtdCurrent>
          <QtdChange>
            <EditInfo>Retirar:</EditInfo>
            <InputChange
              type="number"
              value={newQuantity}
              onChange={({ target: { value } }) => setNewQuantity(+value)}
            />
          </QtdChange>
        </UpdateContainer>
      </Modal>

      <StockAuditList
        visible={visible}
        setVisible={setVisible}
        id={selectedProduct?.id}
        paginate={paginate}
        setPaginate={setPaginate}
      />
    </Container>
  );
};

export default StockList;
