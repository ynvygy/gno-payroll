const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Payroll", function () {
  let owner
  let name, age, salary, contractor, country, payAddress, isHr;
  beforeEach(async () => {
    [owner, payAddress] = await ethers.getSigners()
    const EurToken = await ethers.getContractFactory("Eurefake")
    eurtoken = await EurToken.deploy()
    await eurtoken.deployed()

    const Payroll = await ethers.getContractFactory("Payroll")
    payroll = await Payroll.deploy(eurtoken.address)
    await payroll.deployed();
  
    name = 'Test Name'
    age = 30
    salary = 3000
    contractor = false
    country = 'Germany'
    isHr = false
  })

  describe("#addEmployee", async () => {
    it("Should create a new employee with the correct values", async function () {
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      let employee = await payroll.employees(payAddress.address);
      expect(employee.name).to.equal('Test Name')
    });

    it("Should get all employees", async function () {
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      let employees = await payroll.getEmployees();
      expect(employees.length).to.equal(2)
    });
  });

  describe("#addTaxRate", async () => {
    it("Should create a new tax rate with the correct values", async function () {
      let country = "Germany";
      let names = ["proggressive 1", "proggressive 2"];
      let lowerLimits = [0, 1000];
      let upperLimits = [1000, 2000];
      let taxValues = [10, 15];
      let taxTypes = ["percentage", "percentage"];
      await payroll.connect(owner).addTaxRate(country, names, lowerLimits, upperLimits, taxValues, taxTypes)

      let tax_rate = await payroll.getTaxRate("Germany");
      console.log(tax_rate.name)
      expect(tax_rate[0].name).to.deep.equal("proggressive 1")
      expect(tax_rate[1].lowerLimit).to.deep.equal(1000)
    });
  })
  
  describe("#hoursWorked", async () => {
    it("should add hours worked for an employee and date", async function() {
      const date = 1620421200; // May 7, 2021
      const hoursWorked = 8;
      
      await payroll.connect(payAddress).addHoursWorked(date, hoursWorked);
      const employeeToHours = await payroll.getHoursWorked(date, payAddress.address);
      expect(employeeToHours).to.equal(hoursWorked);
    });
  })

  describe("#getWorkedHours", async () => {
    it("should add hours worked for an employee and date", async function() {
      const date = 1620421200; // May 7, 2021
      const hoursWorked = 8;

      await payroll.connect(payAddress).addHoursWorked(date, hoursWorked);
      const employeeToHours = await payroll.connect(payAddress).getWorkedHours()
      expect(employeeToHours[0][0]).to.equal(date);
      expect(employeeToHours[1][0]).to.equal(hoursWorked);
    });
  })

  describe("#getContractorHours", async () => {
    it("should return the total hours worked by a contractor in April", async function () {
      await payroll.connect(payAddress).addHoursWorked(1617235200, 8); // April 1st 2023
      await payroll.connect(payAddress).addHoursWorked(1617321600, 6); // April 2nd 2023
      await payroll.connect(payAddress).addHoursWorked(1617408000, 7); // April 3rd 2023

      const totalHours = await payroll.getContractorHours(payAddress.address, 1617235200, 1619827200); // April 1st - April 30th 2023
      // Check that the total hours are correct
      expect(totalHours).to.equal(21);
    });
  })

  describe("#salaryEstimator", async () => {
    it("should return the correct salary calculation", async function () {  
      await payroll.connect(owner).addTaxRate(
        "Germany",
        ["prog1", "prog2", "social", "pension", "prog3"],
        [0,1000,0,0,2000],
        [1000,2000,0,0,0],
        [10,15,5,50,20],
        ["percentage", "percentage", "percentage", "flat", "percentage"]
      )
      const estimatedSalary = await payroll.callStatic.salaryEstimator("Germany", 10000)
      expect(estimatedSalary).to.equal(7600)
    });
  })

  describe("#getEmployeeSalary", async () => {
    it("should return the correct salary calculation", async function () {  
      await payroll.connect(owner).addTaxRate(
        "Germany",
        ["prog1"],
        [0,],
        [0],
        [10],
        ["percentage"]
      )
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      const estimatedSalary = await payroll.connect(payAddress).getEmployeeSalary();
      expect(estimatedSalary).to.equal(2700)
    });
  })

  describe.only("#payUnpaidHours", async () => {
    it("should pay the hours", async function () {
      console.log("da")
      await payroll.connect(owner).addTaxRate(
        "Germany",
        ["prog1"],
        [0,],
        [0],
        [10],
        ["percentage"]
      )
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      const amountToSend = ethers.utils.parseEther("1");
      await owner.sendTransaction({
        to: payroll.address,
        value: amountToSend,
      });

      const transferedTokens = 100000;
      await eurtoken.transfer(payroll.address, transferedTokens)

      const getTokenBalancez = await eurtoken.balanceOf(payroll.address)
      console.log("c", getTokenBalancez)

      const date = 1678665600; // 27th of May 2023
  
      await payroll.connect(payAddress).addHoursWorked(date, 2)
  
      await payroll.connect(payAddress).payUnpaidHours();
      const paymentStatus = await payroll.connect(payAddress).getPaymentStatus();
      console.log(paymentStatus)
      const getBalance = await eurtoken.balanceOf(payroll.address);
      console.log("c", getBalance)
  
      //expect(paymentStatus[2][0]).to.be.true;
      expect(getBalance).to.equal(94000);
    })
  })
});

