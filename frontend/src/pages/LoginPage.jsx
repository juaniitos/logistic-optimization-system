import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const onLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await register(values.username, values.email, values.password, values.fullName);
      navigate('/dashboard');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={onLogin}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Por favor ingresa tu usuario' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Usuario"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Contraseña"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          block
        >
          Iniciar Sesión
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Credenciales de prueba: admin / admin123
        </Text>
      </div>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={onRegister}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: 'Por favor ingresa un usuario' },
          { min: 3, message: 'Mínimo 3 caracteres' }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Usuario"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Por favor ingresa tu email' },
          { type: 'email', message: 'Email inválido' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="Email"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="fullName"
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Nombre completo (opcional)"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Por favor ingresa una contraseña' },
          { min: 6, message: 'Mínimo 6 caracteres' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Contraseña"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Por favor confirma tu contraseña' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Las contraseñas no coinciden'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirmar contraseña"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          block
        >
          Registrarse
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Sistema de Optimización Logística
          </Title>
          <Text type="secondary">UPSE - 2025</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: 'Iniciar Sesión',
              children: loginForm
            },
            {
              key: 'register',
              label: 'Registrarse',
              children: registerForm
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default LoginPage;
