import { Navbar, Nav } from 'react-bootstrap';
import { useEffect } from 'react';

const CustomNav = ({account, setAccount, connectWallet}) => {

  useEffect(() => {
    connectWallet();
  }, []);

  const disconnectHandler = () => {
    setAccount(null);
  };

  return (<Navbar bg="light" expand="lg">
    <Navbar.Brand className="justspace" href="#home">gNoSweatJustPayroll</Navbar.Brand>
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="ml-auto">
        <Nav.Link href="/">Dashboard</Nav.Link>
        <Nav.Link href="/employees">Employees</Nav.Link>
        <Nav.Link href="/addemployee">Add</Nav.Link>
        <Nav.Link href="/taxrates">Tax Rates</Nav.Link>
        <Nav.Link href="/addtaxrates">AddT</Nav.Link>
        <Nav.Link href="/reports">Reports</Nav.Link>
        <Nav.Link href="/taxreport">Tax Report</Nav.Link>
      </Nav>
      <Nav className="ml-auto">
        {account ? (
          <Nav.Link className="nav-link" onClick={disconnectHandler}>
            Connected with address {account.slice(0, 6) + '...' + account.slice(38,42)}
          </Nav.Link>
        ) : (
          <Nav.Link className="nav-link" onClick={connectWallet}>
            Connect Wallet
          </Nav.Link>
        )}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
  )
}

export default CustomNav;
