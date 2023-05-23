import { Navbar, Nav } from 'react-bootstrap';
import { useEffect } from 'react';

const CustomNav = ({ account, setAccount, connectWallet, disconnectHandler, accountType }) => {
  console.log(accountType)
  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <>
      <Navbar bg="light" expand="lg" className="top-navbar">
        <div className="navbar-container">
          <div className="brand-container">
            <div className="brand-text">PayGnoll</div>
          </div>
          <div className="ml-auto nav-link-container">
            <div className="brand-container">
              <div className="connected-text">
                {account ? (
                  <Nav.Link className="nav-link" onClick={disconnectHandler}>
                    Connected with address {account.slice(0, 6) + '...' + account.slice(38, 42)}
                  </Nav.Link>
                ) : (
                  <Nav.Link className="nav-link" onClick={connectWallet}>
                    Connect Wallet
                  </Nav.Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Navbar>
      { account ? (
        <Navbar bg="light" expand="lg" className="left-navbar">
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="flex-column">
              <Nav.Link href="/">Dashboard</Nav.Link>
              <Nav.Link href="/employees">Employees</Nav.Link>
              <Nav.Link href="/addemployee">Add Employee</Nav.Link>
              <Nav.Link href="/taxrates">Tax Rates</Nav.Link>
              <Nav.Link href="/addtaxrates">Add Tax Rate</Nav.Link>
              <Nav.Link href="/reports">Reports</Nav.Link>
              <Nav.Link href="/taxreport">Tax Report</Nav.Link>
              <Nav.Link href="/hoursreport">Timesheet</Nav.Link>
              <Nav.Link href="/gnowner">Gnowner</Nav.Link>
              <Nav.Link href="/employeereport">Employee Report</Nav.Link>
              <Nav.Link href="/gnownerreport">Gnowner Report</Nav.Link>
            </Nav>
          </Navbar.Collapse>

          <div className="navbar-brand-container">
            <div className="brand-text">{accountType}</div>
          </div>
        </Navbar>
      ) : (
        <div className="centered-text-container">
          <div className="centered-text-blue">Unlock your peace of mind</div>
          <div className="centered-text"><br/>gNo</div>
          <div className="centered-text-blue"><br/>WorriesJust</div>
          <div className="centered-text"><br/>PayGnoll</div>
        </div>
      ) }
    </>
  );
};

export default CustomNav;
