import React, { useState, useEffect } from "react";
import { cleanObject } from "../../helpers/cleanObject";
import { v4 } from "uuid";

import { message as messageAnt, Popover, Tooltip, notification } from "antd";

import CashNotFound from "../../components/CashNotFound";
import Spinner from "../../components/Spinner";

import { ProductNfe } from "../../models/dtos/productNfe";
import { ProductDto } from "../../models/dtos/product";
import { Nfe } from "../../models/dtos/nfe";

import {
  Container,
  PageContent,
  Header,
  Content,
  LeftContainer,
  RightContainer,
  BalanceContainer,
  PriceContent,
  WeightContent,
  InputMonetary,
  InfoWeight,
  ItemsContainer,
  IconContainer,
  InputSearchProduct,
  ProductSearch,
  SearchIcon,
  TabContainer,
  TabItem,
  Column,
  HeaderItem,
  ColumnProduct,
  ProductContainer,
  ProductContent,
  AddIcon,
  InfoIcon,
  ProductListContainer,
  ProductListHeader,
  ProductColumn,
  ProductsList,
  ProductsContent,
  Product,
  Input,
  FormContainer,
  Row,
  Col,
  FormItem,
  TotalValue,
  Select,
  Option,
  ButtonFinishContent,
  Button,
  Form,
} from "./styles";

const Nfce: React.FC = () => {
  const [cashIsOpen, setCashIsOpen] = useState<boolean>(false);
  const [selfServiceAmount, setSelfServiceAmount] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [nfe, setNfe] = useState<Nfe | null>(null);
  const [emitingNfe, setEmitingNfe] = useState(false);
  const [productsNfe, setProductsNfe] = useState<ProductNfe[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    async function init() {
      const _productsNfce = await window.Main.product.getProducts();
      if (!_productsNfce) {
        messageAnt.error("Falha ao obter produtos para NFe");
      }
      setProducts(_productsNfce);
      const currentStoreCash = await window.Main.storeCash.getCurrent();
      if (currentStoreCash?.is_opened) {
        setCashIsOpen(true);
      } else {
        setCashIsOpen(false);
      }
      setLoading(false);
    }
    init();
  }, []);

  const findSelfService = (products: ProductDto[]): ProductDto => {
    return products.find((product) => product.product.category_id === 1);
  };

  const handleEnterToSubmit = () => {
    const selfService = findSelfService(products);

    const quantity = +(selfServiceAmount / +selfService?.price_unit).toFixed(4);

    handleSelectProduct(selfService, selfServiceAmount, quantity);
  };

  const handleUpdateNfe = (name, value) => {
    setNfe((oldValues) => ({ ...oldValues, [name]: value }));
  };

  const calculateTotal = (productsNfe: ProductNfe[]): string => {
    const total = productsNfe.reduce(
      (total, product) =>
        +product.quantidadeComercial && +product.valorUnitarioComercial
          ? +product.quantidadeComercial * +product.valorUnitarioComercial +
            total
          : total,
      0
    );
    form.setFieldsValue({
      valorPagamento: total.toFixed(2).replace(".", ","),
      totalProdutos: total.toFixed(2).replace(".", ","),
    });

    return total.toFixed(2).replace(".", ",");
  };

  const isValidProduct = (product: ProductDto) => {
    const errors: string[] = [];
    if (!product.product.cod_ncm) {
      errors.push("NCM");
    }
    if (!product.cfop) {
      errors.push("CFOP");
    }
    if (!product.unity_taxable) {
      errors.push("Unidade Tributável");
    }
    if (!product.price_unit) {
      errors.push("Valor de Venda");
    }
    if (!product.icms_origin && product.icms_origin !== 0) {
      errors.push("Origem");
    }
    if (!product.icms_tax_situation) {
      errors.push("Situação Tributária");
    }

    if (errors.length) {
      return {
        valid: false,
        message: `O produto ${
          product.product.name
        } não possui os dados ${errors.join(", ")}`,
      };
    }
    return { valid: true, message: null };
  };

  const handleSelectProduct = (
    product: ProductDto,
    price?: number,
    quantity?: number
  ) => {
    let _productsNfe = productsNfe;

    const productNfe: ProductNfe = {
      id: v4(),
      idItem: product.product_id,
      codigo: product.product_id,
      descricao: product.product.name,
      ncm: product.product.cod_ncm.toString(),
      cfop: product.cfop,
      unidadeComercial: product.unity_taxable?.toString(),
      quantidadeComercial: quantity || 1,
      valorUnitarioComercial: +product.price_unit,
      unidadeTributaria: product.unity_taxable?.toString(),
      quantidadeTributavel: quantity || 1,
      valorUnitarioTributario: +product.price_unit,
      origem: product.icms_origin,
      informacoesAdicionais: product.additional_information,
      PISCOFINSST: false,
      csosn: 102,
      cEAN: "SEM GTIN",
      cEANTrib: "SEM GTIN",
    };

    if (product.product.category_id === 1) {
      _productsNfe = [
        ..._productsNfe.filter(
          (productNfe) => productNfe.idItem !== product.product_id
        ),
        productNfe,
      ];
    } else {
      _productsNfe = [..._productsNfe, productNfe];
    }
    calculateTotal(_productsNfe);
    setProductsNfe(_productsNfe);
  };

  const handlerRemoveProduct = (id: string) => {
    const updatedProducts = productsNfe.filter(
      (productNfe) => productNfe.id !== id
    );
    calculateTotal(updatedProducts);
    setProductsNfe(updatedProducts);
  };

  const handleEmit = () => {
    let payload = form.getFieldsValue();
    if (!productsNfe.length) {
      return notification.warning({
        message: "Oops! O carrinho está vazio.",
        description: `Selecione algum item para continuar com a emissão da nota.`,
        duration: 5,
      });
    }

    if (!payload.formaPagamento || !payload.indicadorFormaPagamento) {
      return notification.warning({
        message: "Operação e Tipo são obrigatórios.",
        description: `Preencha os campos corretamente, para finalizar a emissão da nota.`,
        duration: 5,
      });
    }

    const nfcePayload = {
      ...cleanObject(nfe),
      informacoesAdicionaisFisco:
        nfe.informacoesAdicionaisFisco || "Sem informacoes adicionais",
      valorPagamento: +calculateTotal(productsNfe).replace(",", "."),
      produtos: productsNfe.map(({ id, ...props }, index) => ({
        ...props,
        idItem: index + 1,
        quantidadeTributavel: props.quantidadeComercial,
      })),
    };

    console.log(JSON.stringify(nfcePayload));
    setEmitingNfe(true);
    const nfce = window.Main.sale.emitNfce(nfcePayload);
    setEmitingNfe(false);
    if (!nfce) {
      return notification.error({
        message: "Oops! Não foi possível emitir a NFCe.",
        description: `Tente novamente, caso o problem persista, contate o suporte através do chat.`,
        duration: 5,
      });
    } else {
      return notification.success({
        message: "Emitida com sucesso!",
        description: `A nota fiscal foi emitida com sucesso.`,
        duration: 5,
      });
    }
  };

  const handleUpdateProduct = (id: string, value: number) => {
    if (value <= 0) {
      handlerRemoveProduct(id);
      return;
    }
    const _productsNfe = productsNfe;
    const productToUpdate = _productsNfe.find(
      (productNfe) => productNfe.id === id
    );
    productToUpdate.quantidadeComercial = value;

    const updatedProducts = [
      ..._productsNfe.filter((productNfe) => productNfe.id !== id),
      productToUpdate,
    ];
    calculateTotal(updatedProducts);
    setProductsNfe(updatedProducts);
  };

  const productsFormater = (payload) => {
    let categories = payload.map((product) => ({
      id: product.product.category.id,
      name: product.product.category.name,
      products: [],
    }));

    categories = Array.from(
      new Set(categories.map((category) => category.id))
    ).map((id) => {
      return categories.find((category) => category.id === id);
    });

    categories = categories.map((category) => {
      const productsCategory = payload.filter(
        (product) => product.product.category.id === category.id
      );
      return {
        ...category,
        products: productsCategory,
      };
    });

    categories = categories.filter((category) => category.id !== 1);

    return categories;
  };

  const formasPagamento = [
    { id: "01", value: "Dinheiro" },
    { id: "02", value: "Cheque" },
    { id: "03", value: "Cartão de Crédito" },
    { id: "04", value: "Cartão de Débito" },
    { id: "05", value: "Crédito Loja" },
    { id: "10", value: "Vale Alimentação" },
    { id: "11", value: "Vale Refeição" },
    { id: "12", value: "Vale Presente" },
    { id: "13", value: "Vale Combustível" },
    { id: "15", value: "Boleto Bancário" },
    { id: "99", value: "Outros" },
  ];

  const indicadoresFormaPagamento = [
    { id: 0, value: "À vista" },
    { id: 1, value: "À prazo" },
    { id: 2, value: "Outros" },
  ];

  return (
    <Container>
      <PageContent>
        {loading ? (
          <>
            <Spinner />
          </>
        ) : (
          <>
            {cashIsOpen ? (
              <>
                <Header>
                  <h2>Emissão NFC-e</h2>
                </Header>
                <Content>
                  <LeftContainer>
                    <BalanceContainer>
                      <PriceContent>
                        <span>Preço total self-service</span>
                        <InputMonetary
                          autoFocus={true}
                          id="balanceInput"
                          getValue={(value) => setSelfServiceAmount(+value)}
                          onEnterPress={handleEnterToSubmit}
                        />
                      </PriceContent>
                      <WeightContent>
                        <span>Preço do KG</span>
                        <InfoWeight>
                          R${" "}
                          {findSelfService(products).price_unit?.replace(
                            ".",
                            ","
                          )}
                        </InfoWeight>
                      </WeightContent>
                    </BalanceContainer>

                    <ItemsContainer>
                      <TabContainer defaultActiveKey="1">
                        {productsFormater(products).map((item, index) => (
                          <TabItem tab={item.name} key={index + 1}>
                            <ProductSearch>
                              <IconContainer>
                                <SearchIcon />
                              </IconContainer>
                              <InputSearchProduct placeholder="Procurar item" />
                            </ProductSearch>

                            <HeaderItem>
                              <Column sm={11}>Produto</Column>
                              <Column sm={8}>Preço</Column>
                              <Column sm={5}>Ação</Column>
                            </HeaderItem>

                            <ProductContainer>
                              {item.products.map((product) => (
                                <ProductContent key={product.id}>
                                  <ColumnProduct span={11}>
                                    {product.product.name}
                                  </ColumnProduct>
                                  <ColumnProduct span={8}>
                                    {product.price_unit?.replace(".", ",")}
                                  </ColumnProduct>
                                  <ColumnProduct span={5}>
                                    {isValidProduct(product).valid ? (
                                      <>
                                        {!productsNfe.some(
                                          (productNfe) =>
                                            productNfe.idItem ===
                                            product.product_id
                                        ) && (
                                          <Tooltip
                                            title="Adicionar"
                                            placement="right"
                                          >
                                            <AddIcon
                                              onClick={() =>
                                                handleSelectProduct(product)
                                              }
                                            />
                                          </Tooltip>
                                        )}
                                      </>
                                    ) : (
                                      <Popover
                                        content={
                                          isValidProduct(product).message
                                        }
                                      >
                                        <InfoIcon />
                                      </Popover>
                                    )}
                                  </ColumnProduct>
                                </ProductContent>
                              ))}
                            </ProductContainer>
                          </TabItem>
                        ))}
                      </TabContainer>
                    </ItemsContainer>
                  </LeftContainer>

                  <RightContainer>
                    <ProductListContainer>
                      <ProductListHeader>
                        <ProductColumn span={10}>Produto</ProductColumn>
                        <ProductColumn span={4}>Quantidade</ProductColumn>
                        <ProductColumn span={4}>Valor Unitário</ProductColumn>
                        <ProductColumn span={4}>Valor Total</ProductColumn>
                        <ProductColumn span={2}>Ação</ProductColumn>
                      </ProductListHeader>

                      <ProductsList>
                        <ProductsContent>
                          {productsNfe.map((product) => (
                            <Product key={product.id}>
                              <ProductColumn
                                span={10}
                                style={{ textTransform: "lowercase" }}
                              >
                                <span>{product.descricao}</span>
                              </ProductColumn>
                              <ProductColumn span={4}>
                                {product.idItem === 1 ? (
                                  <span>{product.quantidadeComercial}KG</span>
                                ) : (
                                  <Input
                                    type="number"
                                    defaultValue={product.quantidadeComercial}
                                    onChange={({ target: { value } }) =>
                                      handleUpdateProduct(product.id, +value)
                                    }
                                  />
                                )}
                              </ProductColumn>
                              <ProductColumn span={4}>
                                <span>
                                  {product.valorUnitarioComercial
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </ProductColumn>
                              <ProductColumn span={4}>
                                <span>
                                  R${" "}
                                  {(
                                    product.valorUnitarioComercial *
                                    product.quantidadeComercial
                                  )
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </ProductColumn>
                              <ProductColumn span={2}>
                                <Tooltip title="Remover" placement="bottom">
                                  {/* <DeleteButton
                                    onClick={() =>
                                      handlerRemoveProduct(product.id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </DeleteButton> */}
                                </Tooltip>
                              </ProductColumn>
                            </Product>
                          ))}
                        </ProductsContent>
                      </ProductsList>
                    </ProductListContainer>

                    <FormContainer>
                      <Form layout="vertical" form={form}>
                        <Row>
                          <Col span={24}>
                            <TotalValue>
                              VALOR TOTAL: <strong> R$ 0,00</strong>
                            </TotalValue>
                          </Col>
                          <Col span={8}>
                            <FormItem
                              label="Operação"
                              name="formaPagamento"
                              rules={[{ required: true }]}
                            >
                              <Select
                                placeholder="Escolha a opção"
                                onChange={(value) =>
                                  handleUpdateNfe("formaPagamento", value)
                                }
                              >
                                {formasPagamento.map((formaPagamento) => (
                                  <Option key={formaPagamento.id}>
                                    {formaPagamento.value}
                                  </Option>
                                ))}
                              </Select>
                            </FormItem>
                          </Col>
                          <Col span={8}>
                            <FormItem
                              label="Tipo"
                              name="indicadorFormaPagamento"
                              rules={[{ required: true }]}
                            >
                              <Select
                                placeholder="Escolha a opção"
                                onChange={(value) =>
                                  handleUpdateNfe(
                                    "indicadorFormaPagamento",
                                    +value
                                  )
                                }
                              >
                                {indicadoresFormaPagamento.map(
                                  (indicadorFormaPagamento) => (
                                    <Option key={indicadorFormaPagamento.id}>
                                      {indicadorFormaPagamento.value}
                                    </Option>
                                  )
                                )}
                              </Select>
                            </FormItem>
                          </Col>
                          <Col span={8}>
                            <FormItem label="CPF / CNPJ" name="CPFDestinatario">
                              <Input
                                placeholder="CPF/CNPJ"
                                className="ant-input"
                                onChange={({ target: { value } }) =>
                                  handleUpdateNfe("CPFDestinatario", value)
                                }
                              />
                            </FormItem>
                          </Col>
                          <Col span={24}>
                            <FormItem
                              label="Informações Adicionais"
                              name="informacoesAdicionaisFisco"
                            >
                              <Input.TextArea
                                onChange={({ target: { value } }) =>
                                  handleUpdateNfe(
                                    "informacoesAdicionaisFisco",
                                    value
                                  )
                                }
                              />
                            </FormItem>
                          </Col>
                        </Row>
                        <ButtonFinishContent>
                          <Button type="primary" onClick={() => handleEmit()}>
                            Emitir Nota [F1]
                          </Button>
                        </ButtonFinishContent>
                      </Form>
                    </FormContainer>
                  </RightContainer>
                </Content>
              </>
            ) : (
              <>
                <CashNotFound />
              </>
            )}
          </>
        )}
      </PageContent>
    </Container>
  );
};

export default Nfce;
