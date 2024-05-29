import React, { useEffect, useState } from 'react';
import {
  Account,
  Aptos,
  AptosConfig,
  InputGenerateTransactionPayloadData,
  Network,
  NetworkToNetworkName,
  UserTransactionResponse,
  TransactionWorkerEventsEnum,
} from "@aptos-labs/ts-sdk";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import styled from 'styled-components';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

const moduleAddress = "0xa1f27853ed078768afd4edbaa401e6f644a82cc04f797a6fd7d67c3fda98efe4";

const CenteredWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const CalculatorWrapper = styled.div`
  width: 300px;
  padding: 20px;
  background-color: #fff;
  border-radius: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Display = styled.div`
  background-color: #e0e0e0;
  color: black;
  font-size: 48px;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  text-align: right;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

const Button = styled.button<{ color?: string; wide?: boolean; disabled?: boolean }>`
  background-color: ${({ color, disabled }) => (disabled ? '#c0c0c0' : color || '#d0d0d0')};
  color: ${({ disabled }) => (disabled ? '#888888' : 'black')};
  font-size: 24px;
  padding: 20px;
  border: none;
  border-radius: 15px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  grid-column: ${({ wide }) => (wide ? 'span 2' : 'span 1')};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    opacity: ${({ disabled }) => (disabled ? '1' : '0.8')};
  }
`;

const OperationButton = styled(Button)`
  background-color: ${({ disabled }) => (disabled ? '#c0c0c0' : '#ff9500')};
  color: ${({ disabled }) => (disabled ? '#888888' : 'white')};
`;

const ToggleButton = styled.button<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#4CAF50' : '#f44336')};
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    opacity: 0.8;
  }
`;

const App: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const { account } = useWallet();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActive) return;
      if (event.key >= '0' && event.key <= '9') {
        setInput(prev => prev + event.key);
      } else if (event.key === 'Backspace') {
        setInput(prev => prev.slice(0, -1));
      } else if (event.key === 'Enter') {
        handleOperationClick('=');
      } else if (['+', '-', '*', '/'].includes(event.key)) {
        setInput(prev => prev + ` ${event.key} `);
      } else if (event.key === 'c' || event.key === 'C') {
        setInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  const handleButtonClick = (value: string) => {
    setInput(input + value);
  };

  const handleOperationClick = async (operation: string) => {
    const [num1, operator, num2] = input.split(' ');
    if (!num1 || !num2 || !operator) return;

    try {
      if (!account) return;
      const transaction = await aptos.transaction.build.simple({
        sender: account?.address,
        data: {
          function: `${moduleAddress}::calculator::${operation}`,
          typeArguments: [],
          functionArguments: [num1, num2],
        },
      });

      // using signAndSubmit combined
      // const pendingTransaction = await aptos.signAndSubmitTransaction({
      //   signer: account?.address,
      //   transaction,
      // });
      // console.log(pendingTransaction);

      // const result = (await pendingTransaction.hash()).toString();
      // setResult(result);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleActiveState = () => {
    setIsActive(!isActive);
  };

  return (
    <CenteredWrapper>
      <ToggleButton active={isActive} onClick={toggleActiveState}>
        {isActive ? 'Turn Off' : 'Turn On'}
      </ToggleButton>
      <CalculatorWrapper>
        <Display>{input || '0'}</Display>
        <ButtonGrid>
          <Button color="#FF6663" onClick={() => setInput('')} disabled={!isActive}>C</Button>
          <Button color="#FFB399" onClick={() => setInput(input.slice(0, -1))} disabled={!isActive}>←</Button>
          <Button color="#FF33FF" onClick={() => setInput(input + '**')} disabled={!isActive}>^</Button>
          <OperationButton onClick={() => setInput(input + ' / ')} disabled={!isActive}>÷</OperationButton>
          {[7, 8, 9].map(num => (
            <Button key={num} color="#FFFF99" onClick={() => handleButtonClick(num.toString())} disabled={!isActive}>{num}</Button>
          ))}
          <OperationButton onClick={() => setInput(input + ' * ')} disabled={!isActive}>x</OperationButton>
          {[4, 5, 6].map(num => (
            <Button key={num} color="#FFCC99" onClick={() => handleButtonClick(num.toString())} disabled={!isActive}>{num}</Button>
          ))}
          <OperationButton onClick={() => setInput(input + ' - ')} disabled={!isActive}>-</OperationButton>
          {[1, 2, 3].map(num => (
            <Button key={num} color="#99FF99" onClick={() => handleButtonClick(num.toString())} disabled={!isActive}>{num}</Button>
          ))}
          <OperationButton onClick={() => setInput(input + ' + ')} disabled={!isActive}>+</OperationButton>
          <Button wide color="#FF6663" onClick={() => handleButtonClick('0')} disabled={!isActive}>0</Button>
          <Button color="#66B2FF" onClick={() => handleButtonClick('.')} disabled={!isActive}>.</Button>
          <OperationButton onClick={() => handleOperationClick('=')} disabled={!isActive}>=</OperationButton>
        </ButtonGrid>
        {result && <Display>Result: {result}</Display>}
      </CalculatorWrapper>
    </CenteredWrapper>
  );
};

export default App;
