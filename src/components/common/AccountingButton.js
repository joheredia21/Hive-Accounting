import React, { useState } from 'react';

const AccountingButton = () => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isKeychainAvailable = () => {
    return window.keychain !== undefined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !recipient) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!isKeychainAvailable()) {
      setError('Por favor instale la extensión Keychain para continuar');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Replace with actual Keychain and dhive integration
      // This is a mock implementation for demonstration
      // In real implementation:
      // 1. Create custom_json operation with accounting data
      // 2. Use Keychain to sign and broadcast the transaction
      // 3. Handle the response from blockchain

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful transaction
      const mockTxId = `0x${Math.random().toString(16).substr(2, 10)}`;
      setSuccess(`Transacción registrada exitosamente: ${mockTxId}`);

      // In real implementation, you would:
      // const txId = await blockchainService.recordAccountingEntry(amount, recipient);
      // setSuccess(`Transacción registrada: ${txId}`);
    } catch (err) {
      setError(`Error al registrar transacción: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #FFD700'
    }}>
      <h2 style={{
        textAlign: 'center',
        color: '#FFD700',
        marginBottom: '1.5rem'
      }}>
        Registro Contable
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#FF0000',
          color: '#FFFFFF',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#006400',
          color: '#FFFFFF',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="amount" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Monto (HIVE):
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ingrese el monto"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a1a1a',
              border: '1px solid #FFD700',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="recipient" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Cuenta Destinatario:
          </label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ejemplo: accountname"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a1a1a',
              border: '1px solid #FFD700',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#CCCCCC' : '#FFD700',
            color: '#000000',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Procesando...' : 'Registrar Contable'}
        </button>

        <div style={{
          fontSize: '0.875rem',
          textAlign: 'center',
          marginTop: '1rem',
          color: '#CCCCCC'
        }}>
          Nota: Esta es una interfaz de demostración. Para usar con Keychain real,
          se requiere integración con la biblioteca dhive y la extensión Keychain.
        </div>
      </form>
    </div>
  );
};

export default AccountingButton;