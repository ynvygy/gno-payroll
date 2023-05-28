import { Navbar, Nav } from 'react-bootstrap';
import { useEffect, useState } from 'react';

const CustomNav = ({ account, setAccount, connectWallet, disconnectHandler, accountType }) => {
  const [selectedLink, setSelectedLink] = useState('');

  const handleLinkClick = (link) => {
    setSelectedLink(link);
    localStorage.setItem('selectedLink', link);
  };

  useEffect(() => {
    connectWallet();
    const storedLink = localStorage.getItem('selectedLink');
    if (storedLink) {
      setSelectedLink(storedLink);
    }
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
              <Nav.Link href="/" className={selectedLink === '/' ? 'selected' : ''} onClick={() => handleLinkClick('/')}>Dashgnord</Nav.Link>
              <Nav.Link href="/employees" className={selectedLink === '/employees' ? 'selected' : ''} onClick={() => handleLinkClick('/employees')}>Employees</Nav.Link>
              <Nav.Link href="/addemployee" className={selectedLink === '/addemployee' ? 'selected' : ''} onClick={() => handleLinkClick('/addemployee')}>Add Employee</Nav.Link>
              <Nav.Link href="/taxrates" className={selectedLink === '/taxrates' ? 'selected' : ''} onClick={() => handleLinkClick('/taxrates')}>Tax Rates</Nav.Link>
              <Nav.Link href="/addtaxrates" className={selectedLink === '/addtaxrates' ? 'selected' : ''} onClick={() => handleLinkClick('/addtaxrates')}>Add Tax Rate</Nav.Link>
              <Nav.Link href="/hoursreport" className={selectedLink === '/hoursreport' ? 'selected' : ''} onClick={() => handleLinkClick('/hoursreport')}>Timesheet</Nav.Link>
              <Nav.Link href="/gnowner" className={selectedLink === '/gnowner' ? 'selected' : ''} onClick={() => handleLinkClick('/gnowner')}>Gnowner</Nav.Link>
              <Nav.Link href="/employeereport" className={selectedLink === '/employeereport' ? 'selected' : ''} onClick={() => handleLinkClick('/employeereport')}>Employee Report</Nav.Link>
              <Nav.Link href="/gnownerreport" className={selectedLink === '/gnownerreport' ? 'selected' : ''} onClick={() => handleLinkClick('/gnownerreport')}>Gnowner Report</Nav.Link>
            </Nav>
          </Navbar.Collapse>

          <div className="navbar-brand-container">
            <div className="brand-text-nav">{accountType}</div>
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
