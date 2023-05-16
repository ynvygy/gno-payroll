// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

// import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Payroll {
    address owner;
    address[] hr;
    uint employeesCount;
    uint nextEmployeeId;

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

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    mapping(string => TaxRate[]) CountriesToTaxRates;
    ContractorHours[] public contractorHours;

    mapping(uint => mapping(address => uint)) dateToContractorToHours;
    mapping(address => uint[]) contractorToDates;

    string[] public countries;

    string[] public permissions;
    mapping(string => bool) permissionsState;

    constructor() {
        owner = msg.sender;
        permissions = [
            "Allow to add employees",
            "Allow to remove employees",
            "Allow to edit employees",
            "Allow to make payments"
        ];
    }

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
        employeeAddresses.push(msg.sender);
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

    function calculateSalary(
        address _address
    ) public view returns (string[] memory, uint[] memory) {
        Employee memory employee = employees[_address];
        TaxRate[] memory taxRates = CountriesToTaxRates[employee.country];
        string[] memory salaryInfos = new string[](taxRates.length);
        uint[] memory valueInfos = new uint[](taxRates.length);

        uint salary = employee.salary;
        for (uint i = 0; i < taxRates.length; i++) {
            salaryInfos[i] = taxRates[i].name;
            uint valueInfo;
            if (salary > taxRates[i].lowerLimit) {
                valueInfo =
                    (salary - taxRates[i].lowerLimit) /
                    taxRates[i].taxValue;
            }
        }

        return (salaryInfos, valueInfos);
    }

    // Thank you ChatGPT
    function uintToString(uint256 value) public pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function logHours(uint _hoursWorked, uint _employeeId) public {}

    function calculateContractorSalary(
        address _address
    ) public view returns (uint) {
        Employee memory employee = employees[_address];
        //TaxRates storage taxRate = TaxRates[employee.country];
        // working hours
        // getContractorWorkingHours
        //return workinghours * salary;
        return employee.salary;
    }

    function getThisMonthsSalaryInfo(
        uint startDate,
        uint endDate
    ) public view returns (uint) {
        uint totalHours = getContractorHours(msg.sender, startDate, endDate);
        console.log(totalHours);
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
    }

    function getHoursWorked(
        uint date,
        address _address
    ) public view returns (uint) {
        return dateToContractorToHours[date][_address];
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

    function getContractor() public {}

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

    function getMonth() public view returns (uint) {
        return ((block.timestamp / 1 days) % 365) / 30 + 1;
    }

    function getMonthlyExpenses()
        public
        view
        returns (address[] memory, string[] memory, uint[] memory)
    {
        //uint currentMonth = getMonth(now);
        //uint currentYear = getYear(now);
        //uint startOfMonth = getTimestamp(currentYear, currentMonth, 1);
        //uint endOfMonth = getTimestamp(currentYear, currentMonth + 1, 1) - 1;
        uint startOfMonth = 1681156800;
        uint endOfMonth = 1681156800;

        uint[] memory salaries = new uint[](employeeAddresses.length);
        string[] memory countries = new string[](employeeAddresses.length);

        for (uint i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            uint[] storage workedDates = contractorToDates[employeeAddress];
            uint totalHours = 0;

            for (uint j = 0; j < workedDates.length; j++) {
                uint date = workedDates[j];
                if (date >= startOfMonth && date <= endOfMonth) {
                    totalHours += dateToContractorToHours[date][
                        employeeAddress
                    ];
                }
            }

            Employee storage employee = employees[employeeAddress];
            string memory country = employee.country;
            uint salary = salaryEstimator(
                country,
                totalHours * employee.salary
            );
            salaries[i] = salary;
            countries[i] = country;
        }

        return (employeeAddresses, countries, salaries);
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

    function getContractorHoursByMonth(
        uint contractorId,
        uint year,
        uint month
    ) public view returns (uint) {
        uint totalHours = 0;
        uint startOfMonth = getStartOfMonthTimestamp(year, month);
        //uint endOfMonth = getEndOfMonthTimestamp(year, month);
        //console.log(startOfMonth);
        //for (uint i = startOfMonth; i <= endOfMonth; i += 1 days) {
        //   totalHours += dateToContractorToHours[i][contractorId];
        //}

        //return totalHours;
        return 4;
    }

    function getStartOfMonthTimestamp(
        uint year,
        uint month
    ) public pure returns (uint) {
        // Convert year and month to a DateTime struct
        //DateTime memory dt = DateTime({year: year, month: month, day: 1});
        // Get the Unix timestamp of the start of the month
        //uint startOfMonth = uint(DateTimeLibrary.toTimestamp(dt));
        //return startOfMonth;
        return 3;
    }
}
