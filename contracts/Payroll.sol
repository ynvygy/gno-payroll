// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

// import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Payroll {
    address owner;
    address[] hr;
    uint employeesCount;
    uint nextEmployeeId;
    IERC20 public eurefakeToken;

    struct Employee {
        string name;
        uint age;
        uint salary;
        bool contractor;
        string country;
        bool isHr;
    }

    struct TaxRate {
        string name;
        uint lowerLimit;
        uint upperLimit;
        uint taxValue;
        string taxType;
    }

    struct ContractorHours {
        uint dateReported;
        uint hoursReported;
        address contractorAddress;
    }

    struct Payment {
        uint paymentAmount;
        uint256 taxes;
        bool paid;
        bool paidTaxes;
    }

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    mapping(string => TaxRate[]) CountriesToTaxRates;
    ContractorHours[] public contractorHours;

    mapping(uint => mapping(address => uint)) dateToContractorToHours;
    mapping(address => uint[]) contractorToDates;
    mapping(uint => mapping(address => Payment)) dateToContractorToPayment;

    mapping(address => Payment[]) employeeToPayments;

    string[] public countries;

    string[] public permissions;
    mapping(string => bool) permissionsState;

    constructor(address eurefakeTokenAddress) {
        owner = msg.sender;
        permissions = [
            "Allow to add employees",
            "Allow to remove employees",
            "Allow to edit employees",
            "Allow to make payments"
        ];
        eurefakeToken = IERC20(eurefakeTokenAddress);
    }

    receive() external payable {}

    function getCountries() public view returns (string[] memory) {
        return countries;
    }

    function getPermissions()
        public
        view
        returns (string[] memory, bool[] memory)
    {
        uint256 numPermissions = permissions.length;
        bool[] memory permissionValues = new bool[](numPermissions);

        for (uint256 i = 0; i < numPermissions; i++) {
            bool permissionValue = permissionsState[permissions[i]];
            permissionValues[i] = permissionValue;
        }

        return (permissions, permissionValues);
    }

    function setPermissions(bool[] memory newPermissions) public {
        for (uint i = 0; i < newPermissions.length; i++) {
            permissionsState[permissions[i]] = newPermissions[i];
        }
    }

    function addEmployee(
        string memory _name,
        uint _age,
        uint _salary,
        bool _contractor,
        string memory _country,
        address _payAddress,
        bool _isHr
    ) public {
        Employee memory newEmployee = Employee(
            _name,
            _age,
            _salary,
            _contractor,
            _country,
            _isHr
        );
        employees[_payAddress] = newEmployee;
        if (_isHr) {
            hr.push(_payAddress);
        }
        employeeAddresses.push(_payAddress);
        nextEmployeeId++;
    }

    function updateEmployee(
        address _employeeAddress,
        string memory _name,
        uint _age,
        uint _salary,
        bool _contractor,
        string memory _country,
        bool _isHr
    ) public {
        Employee storage employee = employees[_employeeAddress];

        employee.name = _name;
        employee.age = _age;
        employee.salary = _salary;
        employee.contractor = _contractor;
        employee.country = _country;
        employee.isHr = _isHr;
    }

    function removeEmployee(address employeeAddress) public {
        delete employees[employeeAddress];

        uint indexToRemove;
        for (uint i = 0; i < employeeAddresses.length; i++) {
            if (employeeAddresses[i] == employeeAddress) {
                indexToRemove = i;
                break;
            }
        }
        for (uint i = indexToRemove; i < employeeAddresses.length - 1; i++) {
            employeeAddresses[i] = employeeAddresses[i + 1];
        }
        employeeAddresses.pop();
    }

    function getEmployees()
        public
        view
        returns (Employee[] memory, address[] memory)
    {
        Employee[] memory result = new Employee[](employeeAddresses.length);
        for (uint i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            result[i] = employees[employeeAddress];
        }
        return (result, employeeAddresses);
    }

    function getThisMonthsSalaryInfo(
        uint startDate,
        uint endDate
    ) public view returns (uint) {
        uint totalHours = getContractorHours(msg.sender, startDate, endDate);
        uint ratePerHour = employees[msg.sender].salary;
        return totalHours * ratePerHour;
    }

    function getTaxRate(
        string memory country
    ) public view returns (TaxRate[] memory) {
        return CountriesToTaxRates[country];
    }

    function addTaxRate(
        string memory country,
        string[] memory names,
        uint[] memory lowerLimits,
        uint[] memory upperLimits,
        uint[] memory taxValues,
        string[] memory taxTypes
    ) public {
        countries.push(country);
        for (uint i = 0; i < names.length; i++) {
            TaxRate memory taxRate = TaxRate({
                name: names[i],
                lowerLimit: lowerLimits[i],
                upperLimit: upperLimits[i],
                taxValue: taxValues[i],
                taxType: taxTypes[i]
            });
            CountriesToTaxRates[country].push(taxRate);
        }
    }

    function addHoursWorked(uint date, uint hoursWorked) public {
        dateToContractorToHours[date][msg.sender] += hoursWorked;
        contractorToDates[msg.sender].push(date);
        Employee storage employee = employees[msg.sender];
        uint toPay = hoursWorked * employee.salary;
        Payment memory payment = Payment(toPay, 0, false, false);
        console.log(msg.sender);
        dateToContractorToPayment[date][msg.sender] = payment;
    }

    function getHoursWorked(
        uint date,
        address _address
    ) public view returns (uint) {
        return dateToContractorToHours[date][_address];
    }

    function getPaymentStatus()
        public
        view
        returns (uint[] memory, uint[] memory, bool[] memory)
    {
        Employee storage employee = employees[msg.sender];

        if (employee.contractor) {
            uint numDates = contractorToDates[msg.sender].length;
            uint[] memory dates = new uint[](numDates);
            uint[] memory sums = new uint[](numDates);
            bool[] memory paymentStatuses = new bool[](numDates);

            for (uint i = 0; i < numDates; i++) {
                uint date = contractorToDates[msg.sender][i];
                dates[i] = date;
                sums[i] =
                    dateToContractorToHours[date][msg.sender] *
                    employee.salary;
                paymentStatuses[i] = dateToContractorToPayment[date][msg.sender]
                    .paid;
            }

            return (dates, sums, paymentStatuses);
        } else {
            uint numDates = employeeToPayments[msg.sender].length;

            uint[] memory totalSalaries = new uint[](numDates);
            uint[] memory afterTaxes = new uint[](numDates);
            bool[] memory paymentStatuses = new bool[](numDates);

            for (uint i = 0; i < numDates; i++) {
                totalSalaries[i] = employee.salary;
                afterTaxes[i] = salaryEstimator(
                    employee.country,
                    employee.salary
                );
                paymentStatuses[i] = employeeToPayments[msg.sender][i].paid;
            }
            return (totalSalaries, afterTaxes, paymentStatuses);
        }
    }

    function getWorkedHours()
        public
        view
        returns (uint[] memory, uint[] memory)
    {
        return getContractorWorkedHours(msg.sender);
    }

    function getContractorWorkedHours(
        address contractor
    ) public view returns (uint[] memory, uint[] memory) {
        uint[] storage contractorDates = contractorToDates[contractor];
        uint numDates = contractorDates.length;
        uint[] memory datesW = new uint[](numDates);
        uint[] memory hoursW = new uint[](numDates);

        for (uint i = 0; i < numDates; i++) {
            uint date = contractorDates[i];
            datesW[i] = date;
            hoursW[i] = dateToContractorToHours[date][contractor];
        }

        return (datesW, hoursW);
    }

    function getContractorHours(
        address _address,
        uint startDate,
        uint endDate
    ) public view returns (uint) {
        uint totalHours = 0;
        uint[] storage datesWorked = contractorToDates[_address];
        for (uint i = 0; i < datesWorked.length; i++) {
            uint date = datesWorked[i];
            if (date >= startDate && date <= endDate) {
                totalHours += dateToContractorToHours[date][_address];
            }
        }
        return totalHours;
    }

    function salaryEstimator(
        string memory _country,
        uint _value
    ) public view returns (uint) {
        uint salaryLeft = _value;
        TaxRate[] memory taxRate = CountriesToTaxRates[_country];
        for (uint i = 0; i < taxRate.length; i++) {
            if (taxRate[i].lowerLimit == 0 && taxRate[i].upperLimit == 0) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -= (_value * taxRate[i].taxValue) / 100;
                }
            } else if (
                _value >= taxRate[i].lowerLimit && taxRate[i].upperLimit == 0
            ) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -=
                        ((_value - taxRate[i].lowerLimit) *
                            taxRate[i].taxValue) /
                        100;
                }
            } else if (
                _value >= taxRate[i].lowerLimit &&
                _value >= taxRate[i].upperLimit
            ) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -=
                        ((taxRate[i].upperLimit - taxRate[i].lowerLimit) *
                            taxRate[i].taxValue) /
                        100;
                }
            }
        }
        return salaryLeft;
    }

    function getEmployeeSalary() public view returns (uint) {
        Employee storage employee = employees[msg.sender];
        string memory country = employee.country;
        uint salary = employee.salary;
        return salaryEstimator(country, salary);
    }

    function getFilteredExpenses(
        uint startDate,
        uint endDate
    ) public view returns (address[] memory, string[] memory, uint[] memory) {
        uint[] memory salaries = new uint[](employeeAddresses.length);
        string[] memory countries = new string[](employeeAddresses.length);

        for (uint i = 0; i < employeeAddresses.length; i++) {
            address employee = employeeAddresses[i];
            uint salary;
            if (employees[employee].contractor) {
                uint[] storage workedDates = contractorToDates[employee];
                uint totalHours = 0;

                for (uint j = 0; j < workedDates.length; j++) {
                    uint date = workedDates[j];
                    if (date >= startDate && date <= endDate) {
                        totalHours += dateToContractorToHours[date][employee];
                    }
                }
                salary = salaryEstimator(
                    employees[employee].country,
                    totalHours * employees[employee].salary
                );
            } else {
                salary = salaryEstimator(
                    employees[employee].country,
                    employees[employee].salary
                );
            }
            salaries[i] = salary;
            countries[i] = employees[employee].country;
        }

        return (employeeAddresses, countries, salaries);
    }

    function payUnpaidHours() public {
        uint totalPayment = 0;

        Employee storage employee = employees[msg.sender];
        if (employee.contractor) {
            for (uint i = 0; i < contractorToDates[msg.sender].length; i++) {
                uint date = contractorToDates[msg.sender][i];

                Payment storage payment = dateToContractorToPayment[date][
                    msg.sender
                ];

                if (!payment.paid) {
                    totalPayment += payment.paymentAmount;
                    payment.paid = true;
                }
            }
            uint256 amount = totalPayment * (10 ** 18);
            eurefakeToken.transfer(msg.sender, amount);
        } else {
            Payment[] storage payments = employeeToPayments[msg.sender];
            for (uint i = 0; i < payments.length; i++) {
                uint toPay = (payments[i].paymentAmount + payments[i].taxes) *
                    (10 ** 18);
                eurefakeToken.transfer(msg.sender, toPay);
                payments[i].paid = true;
            }
        }
    }

    function getAccountType() public view returns (string memory) {
        if (owner == msg.sender) {
            return "Gnowner";
        } else {
            Employee storage employee = employees[msg.sender];
            if (employee.isHr) {
                return "HR";
            } else if (employee.contractor) {
                return "Contractor";
            } else {
                return "Employee";
            }
        }
    }

    function generatePaymentsForCurrentMonth(uint monthUnix) public {
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            Employee memory employee = employees[employeeAddresses[i]];
            if (!employee.contractor) {
                uint256 paymentAmount = salaryEstimator(
                    employee.country,
                    employee.salary
                );
                uint256 taxes = employee.salary - paymentAmount;

                Payment memory payment = Payment(
                    paymentAmount,
                    taxes,
                    false,
                    false
                );
                employeeToPayments[employeeAddresses[i]].push(payment);
            }
        }
    }

    function getUnpaidSalariesSum() public view returns (uint256) {
        uint256 totalUnpaidSalaries = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            Payment[] storage payments = employeeToPayments[employeeAddress];

            for (uint256 j = 0; j < payments.length; j++) {
                if (!payments[j].paid) {
                    totalUnpaidSalaries += payments[j].paymentAmount;
                }
            }
        }

        totalUnpaidSalaries += getThisMonthsSalaryInfo(1672454400, 1677721599);

        return totalUnpaidSalaries;
    }

    function getTaxExpenses() public view returns (uint256) {
        uint256 totalUnpaidTaxes = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            Payment[] storage payments = employeeToPayments[employeeAddress];

            for (uint256 j = 0; j < payments.length; j++) {
                if (!payments[j].paidTaxes) {
                    totalUnpaidTaxes += payments[j].taxes;
                }
            }
        }

        return totalUnpaidTaxes;
    }
}
