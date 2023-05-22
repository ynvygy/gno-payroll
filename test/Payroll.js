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
  
    const Payroll = await ethers.getContractFactory("Payroll")
  
    payroll = await Payroll.deploy()
    await payroll.deployed();
  
    name = 'Test Name'
    age = 30
    salary = 4000
    contractor = false
    country = 'Germany'
    isHr = false
  })

  describe("#addEmployee", async () => {
    it("Should create a new employee with the correct values", async function () {
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      let employee = await payroll.employees(0);
      expect(employee.name).to.equal('Test Name')
    });

    it("Should get all employees", async function () {
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      let employees = await payroll.getEmployees();
      expect(employees.length).to.equal(1)
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
  
  describe("#calculateSalary", async () => {
    it("Should return the correct salary", async function () {
      let country = "Germany"
      let taxRateTypes = [10000, 20000]
      let taxRatePercentages = [10, 15]
      let otherTaxRateTypes = ["social", "pension"]
      let otherTaxRatePercentages = [10, 10]
      await payroll.connect(owner).addTaxRate(country, taxRateTypes, taxRatePercentages, otherTaxRateTypes, otherTaxRatePercentages)
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)
      const response = await payroll.calculateSalary(0)
      const readableArray = response.map(innerArray => {
        return innerArray.map(element => {
          if (typeof element === 'string') {
            return Buffer.from(element.substring(2), 'hex').toString();
          } else {
            return element.toString();
          }
        });
      });
      console.log(readableArray)
      expect(await payroll.calculateSalary(0)).to.equal(0)
    })
  })
  describe("#HoursWorked", async () => {
    it("should add hours worked for an employee and date", async function() {
      const date = 1620421200; // May 7, 2021
      const employeeId = 1;
      const hoursWorked = 8;
      await payroll.connect(payAddress).addHoursWorked(date, hoursWorked);
      const employeeToHours = await payroll.getHoursWorked(date, payAddress.address);
      expect(employeeToHours).to.equal(hoursWorked);
    });
  })

  describe("#getContractorHours", async () => {
    it("should return the total hours worked by a contractor in April", async function () {
      await payroll.addHoursWorked(1617235200, 8); // April 1st
      await payroll.addHoursWorked(1617321600, 6); // April 2nd
      await payroll.addHoursWorked(1617408000, 7); // April 3rd
  
      const totalHours = await payroll.getContractorHours(1, 1617235200, 1619827200); // April 1st - April 30th
      console.log(totalHours)
      // Check that the total hours are correct
      expect(totalHours).to.equal(21);
    });
  })

  describe("#getContractorSalary", async () => {
    it("should return the total hours worked by a contractor in April", async function () {
      await payroll.addHoursWorked(1617235200, 8); // April 1st
      await payroll.addHoursWorked(1617321600, 6); // April 2nd
      await payroll.addHoursWorked(1617408000, 7); // April 3rd
  
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      let employee = await payroll.employees(0);
      const expectedSalary = await payroll.getContractorSalary(0, 1617235200, 1619827200); // April 1st - April 30th
      expect(expectedSalary).to.equal(84000)
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
      expect(estimatedSalary).to.equal(3600)
    });
  })

  describe.only("#payUnpaidHours", async () => {
    it("should pay the hours", async function () {
      await payroll.connect(owner).addTaxRate(
        "Germany",
        ["prog1"],
        [0,],
        [0],
        [10],
        ["percentage"]
      )
      await payroll.connect(owner).addEmployee(name, age, salary, contractor, country, payAddress.address, isHr)

      const amountToSend = ethers.utils.parseEther("7");
      await owner.sendTransaction({
        to: payroll.address,
        value: amountToSend,
      });

      const date = 1679836800;
  
      await payroll.connect(payAddress).addHoursWorked(date, 2)
  
      await payroll.connect(payAddress).payUnpaidHours();
      const paymentStatus = await payroll.connect(payAddress).getPaymentStatus();

      expect(paymentStatus[2][0]).to.be.true;
    })
  })
});

