# JobberFlow Manager

JOB WORK BOM, INVENTORY & PRODUCTION MANAGEMENT WEB APPLICATION

Build a complete web-based Bill of Materials, Job Work, Raw Material Inventory, Finished Goods, Wastage and Jobber Reconciliation Management System for a plastic household products manufacturing company.

The company owns:

Raw Materials

Packaging Materials

Brand

Finished Products

However, manufacturing is outsourced to third-party manufacturing units called:

Jobbers

The company sends raw materials to Jobbers.

The Jobber manufactures the finished products.

The finished products are then received back by the company.

The application must accurately track:

Raw Material Stock in Company Warehouse

Raw Material transferred to each Jobber

Raw Material still lying with each Jobber

Standard BOM consumption

Finished Product quantity received

Overall manually entered Wastage for each production voucher

Actual material consumption

Finished Goods inventory

Raw Material returned by Jobbers

Jobber-wise reconciliation

Jobber-wise wastage

Voucher-wise wastage

Product-wise wastage

Complete stock ledgers and audit trail

1. CORE BUSINESS PRINCIPLE

Sending raw material to a Jobber is NOT consumption.

It is a:

STOCK TRANSFER

Example:

Warehouse PP Plastic Stock:

500 KG

Material sent to ABC Plastics:

100 KG

After posting Material Transfer Voucher:

Warehouse PP Plastic:

400 KG

ABC Plastics Stock:

100 KG

Total Company-Owned PP Plastic:

500 KG

No material has been consumed yet.

Consumption happens only when finished products are received and the:

PRODUCT INWARD VOUCHER

is posted.

2. COMPLETE BUSINESS FLOW

Use the following complete workflow:

RAW MATERIAL INWARD

↓

WAREHOUSE RAW MATERIAL STOCK

↓

MATERIAL TRANSFER TO JOBBER

↓

Warehouse Stock decreases

↓

Jobber Stock increases

↓

Material remains company property

↓

JOBBER MANUFACTURES PRODUCTS

↓

FINISHED PRODUCT RECEIVED

↓

PRODUCT INWARD VOUCHER

↓

Select Jobber

↓

Select Finished Product

↓

Enter Finished Quantity Received

↓

System loads applicable BOM

↓

System calculates Standard BOM Consumption

↓

System displays Total Standard Material Consumption

↓

User manually calculates wastage outside/systematically

↓

User enters ONE:

Overall Wastage KG

↓

System calculates Actual Total Consumption

↓

System deducts standard BOM quantities from respective materials

↓

System deducts Overall Wastage from the Product's Primary Raw Material

↓

Finished Goods Stock increases

↓

Unused Raw Material remains visible under Jobber Stock

↓

Material can later be returned using Material Return Voucher

↓

Jobber Reconciliation

3. IMPORTANT WASTAGE RULE

Wastage must NOT be calculated item-wise.

Do NOT provide separate wastage fields against:

Plastic Material

Master Batch

Bags

Stickers

Labels

Other BOM components

Instead, each Product Inward Voucher must contain a separate section:

WASTAGE DETAILS

Fields:

Overall Wastage KG

Wastage Remarks

Reason / Notes, optional

The user will manually calculate total wastage and enter only the final total quantity in KG.

Example:

Standard Total Material Consumption:

26.800 KG

Overall Wastage manually calculated:

1.200 KG

Actual Total Material Consumption:

28.000 KG

4. WASTAGE MUST BE VOUCHER-SPECIFIC

Wastage is NOT fixed.

Do NOT store fixed wastage in:

BOM Master

Product Master

Jobber Master

Every production voucher can have different wastage.

Example:

Same Product:

1 Litre Bottle

Same BOM:

1,000 PCS

Voucher 1

Jobber:

ABC Plastics

Production:

1,000 PCS

Overall Wastage:

1.20 KG

Voucher 2

Jobber:

XYZ Industries

Production:

1,000 PCS

Overall Wastage:

2.10 KG

Voucher 3

Jobber:

ABC Plastics

Another Batch

Production:

1,000 PCS

Overall Wastage:

0.75 KG

Every voucher must independently store its own wastage.

Never automatically copy the wastage from previous vouchers.

New vouchers should always start with:

Overall Wastage = 0.000 KG

5. PRIMARY RAW MATERIAL CONCEPT

Because wastage is entered only as one total KG amount and not material-wise, every finished product BOM must identify one:

PRIMARY RAW MATERIAL

Normally this will be the main plastic raw material.

Example:

Product:

1 Litre Bottle

BOM:

PP Plastic = 25 KG

Master Batch = 0.50 KG

Packaging Bags = 1 KG

Sticker = 0.30 KG

Primary Raw Material:

PP Plastic

If Overall Wastage entered is:

1.20 KG

The system will deduct:

Standard PP:

25 KG

Overall Wastage:

1.20 KG

=

26.20 KG PP deduction

Other BOM materials are deducted only at their standard BOM consumption.

This keeps stock reconciliation possible without requiring item-wise wastage entry.

6. APPLICATION MODULES

Create the following modules.

Masters

Jobber Master

Raw Material Master

Finished Product Master

BOM Master

Inventory

Raw Material Inward

Warehouse Stock

Jobber Stock

Finished Goods Stock

Raw Material Ledger

Finished Goods Ledger

Transactions

Raw Material Inward Voucher

Material Transfer to Jobber Voucher

Product Inward from Jobber Voucher

Material Return from Jobber Voucher

Stock Adjustment Voucher

Reports

Warehouse Stock Report

Jobber Stock Report

Consolidated Stock Report

Raw Material Ledger

Jobber Ledger

Material Transfer Register

Product Inward Register

BOM Consumption Report

Overall Wastage Report

Jobber-wise Wastage Report

Product-wise Wastage Report

Jobber Performance Report

Jobber Reconciliation Report

Finished Goods Stock Report

Administration

Users

Roles

Permissions

Company Settings

Audit Trail

7. JOBBER MASTER

Create Jobber Master.

Fields:

Jobber ID

Jobber Code

Jobber Name

Company Name

Contact Person

Mobile Number

Alternate Mobile Number

Email

Address

City

State

PIN Code

GST Number

PAN Number

Remarks

Active / Inactive

Created At

Created By

Updated At

Updated By

Example:

Jobber Code:

JOB001

Jobber Name:

ABC Plastics

Location:

Ahmedabad

8. RAW MATERIAL MASTER

Create Raw Material Master.

Fields:

Material ID

Material Code

Material Name

Material Category

Unit of Measurement

Minimum Stock Level

Description

Active / Inactive

Current UOM:

KG

Example Raw Materials:

RM001 - PP Plastic

RM002 - Blue Master Batch

RM003 - Packaging Bags

RM004 - Stickers

RM005 - Labels

Material Categories:

Plastic Raw Material

Master Batch

Packaging

Bags

Stickers

Labels

Other

Keep database architecture ready for other UOMs in future.

9. FINISHED PRODUCT MASTER

Create Finished Product Master.

Fields:

Product ID

Product Code

Product Name

Product Category

Unit

Description

Active / Inactive

Created At

Updated At

Finished Product UOM:

PCS

Example:

Product Code:

FG001

Product Name:

1 Litre Plastic Bottle

UOM:

PCS

10. BOM MASTER

Create a Bill of Materials Master.

Recommended BOM Basis:

1,000 PCS

Example:

Product:

1 Litre Plastic Bottle

Production Base:

1,000 PCS

Standard BOM:

Raw MaterialStandard QuantityPP Plastic25.000 KGMaster Batch0.500 KGPackaging Bags1.000 KGSticker0.300 KG

Total Standard Consumption:

26.800 KG

Primary Raw Material:

PP Plastic

11. BOM HEADER

Fields:

BOM ID

BOM Number

Finished Product

BOM Version

Base Production Quantity

Effective From

Effective To

Active / Inactive

Remarks

Created By

Created At

12. BOM COMPONENTS

Fields:

BOM ID

Raw Material

Standard Quantity

UOM

Sequence

Primary Raw Material Yes / No

Only one component should normally be marked:

Primary Raw Material = Yes

Example:

PP Plastic:

Primary = Yes

Master Batch:

Primary = No

Bags:

Primary = No

Sticker:

Primary = No

13. BOM MUST NOT INCLUDE WASTAGE

Important:

BOM stores only:

STANDARD THEORETICAL CONSUMPTION

Do NOT include:

Standard Wastage

Jobber Wastage

Wastage %

Estimated Wastage

inside BOM consumption.

Actual wastage will always be entered separately on Product Inward Voucher.

14. BOM VERSION CONTROL

Never overwrite an old BOM.

Example:

Bottle BOM V1

Effective:

01-Apr-2026

Bottle BOM V2

Effective:

01-Aug-2026

Historical Product Inward Vouchers must continue using the BOM version selected at the time of posting.

15. BOM CALCULATION

Formula:

Standard Material Consumption = Finished Quantity Received ÷ BOM Base Quantity × BOM Material Quantity

Example:

BOM:

PP Plastic:

25 KG per 1,000 PCS

Production:

2,500 PCS

Calculation:

2,500 ÷ 1,000 × 25

=

62.500 KG

Perform this calculation separately for every BOM material.

Use minimum:

3 decimal places

16. INVENTORY LOCATIONS

The application must maintain separate stock at:

MAIN WAREHOUSE

Raw Material physically available in company warehouse.

JOBBER STOCK

Company-owned Raw Material physically lying with each Jobber.

FINISHED GOODS

Finished Products received back by the company.

Never combine these stock locations.

17. TOTAL COMPANY RAW MATERIAL

Calculate:

Total Company Raw Material = Warehouse Stock + Stock at All Jobbers

Example:

Warehouse PP:

400 KG

ABC Plastics:

73.80 KG

XYZ Industries:

50 KG

Total Company PP:

523.80 KG

18. RAW MATERIAL INWARD VOUCHER

Create:

RAW MATERIAL INWARD

Used for:

Opening Stock

Purchase Inward

Other Material Inward

Initial Inventory

Header:

Voucher Number

Date

Transaction Type

Supplier

Invoice Number

Challan Number

Reference

Remarks

Status

Material Grid:

Material

UOM

Quantity

Remarks

Posting increases:

Warehouse Stock

19. WAREHOUSE STOCK SCREEN

Display:

Material Code

Material Name

Category

Opening

Total Inward

Material Sent to Jobbers

Material Returned from Jobbers

Adjustments

Current Warehouse Balance

Minimum Stock

Stock Status

Filters:

Material

Category

Date

20. MATERIAL TRANSFER TO JOBBER

Create:

MATERIAL TRANSFER TO JOBBER VOUCHER

Header:

Voucher Number

Date

Jobber

Jobber Code

Challan Number

Vehicle Number

Reference Number

Remarks

Status

Material Grid:

Material Code

Material Name

Warehouse Available Stock

Quantity Sent KG

Remarks

Allow multiple Raw Materials in one voucher.

21. MATERIAL TRANSFER STOCK EFFECT

Example:

Warehouse PP:

500 KG

Send to ABC Plastics:

100 KG

After Posting:

Warehouse:

400 KG

ABC Plastics:

100 KG

Total Company Material:

500 KG

This must be treated as:

Stock Transfer

Not consumption.

22. MATERIAL TRANSFER VALIDATION

Do not allow:

Quantity Sent > Warehouse Available Stock

Example:

Warehouse Available:

50 KG

User enters:

75 KG

Show:

Insufficient Warehouse Stock. Available: 50.000 KG, Requested: 75.000 KG.

Prevent posting.

23. JOBBER STOCK SCREEN

Create dedicated:

STOCK AT JOBBER

User can select:

Jobber

Material

Date

Display:

MaterialOpeningReceivedStandard ConsumedWastageReturnedAdjustmentBalance

Example:

ABC Plastics

PP Plastic:

Received:

100 KG

Standard Consumed:

25 KG

Overall Wastage:

1.20 KG

Closing:

73.80 KG

24. JOBBER MATERIAL POOL

Do not force material sent in one Material Transfer Voucher to be consumed by one Product Inward Voucher.

Jobber stock must operate as a combined:

JOBBER MATERIAL POOL

Example:

First Transfer:

100 KG PP

Second Transfer:

50 KG PP

Jobber Total Available:

150 KG

Production can consume material from the total Jobber balance.

A Product Inward Voucher may optionally reference a Material Transfer Voucher, but the reference must not be compulsory.

25. PRODUCT INWARD VOUCHER

Create the most important transaction:

PRODUCT INWARD FROM JOBBER

This voucher is created whenever finished products are received from a Jobber.

26. PRODUCT INWARD HEADER

Fields:

Product Inward Voucher Number

Voucher Date

Jobber

Jobber Code

Jobber Challan Number

Finished Product

Finished Quantity Received

UOM

BOM Version

Batch Number

Production Reference

Remarks

Status

When Product is selected:

Automatically load the applicable BOM.

27. PRODUCT INWARD STANDARD CONSUMPTION TABLE

After Product and Production Quantity are entered, display:

MaterialAvailable with JobberStandard BOM ConsumptionBalance After Standard ConsumptionPP Plastic100.00025.00075.000Master Batch3.0000.5002.500Bags5.0001.0004.000Sticker2.0000.3001.700

Do NOT show item-wise Wastage fields.

28. SEPARATE WASTAGE SECTION

Below the BOM calculation table create a clearly separated card/section:

WASTAGE DETAILS

Fields:

Overall Wastage KG

Manual numeric entry.

Default:

0.000

Primary Raw Material

Automatically display from BOM.

Example:

PP Plastic

This should normally be read-only.

Wastage Remarks

Free-text input.

Example:

"Machine startup and colour change loss."

Total Standard Consumption

Automatically calculated.

Overall Wastage

Manual value.

Total Actual Material Consumption

Automatically calculated.

29. WASTAGE SECTION EXAMPLE

Product:

1 Litre Bottle

Quantity:

1,000 PCS

Standard BOM:

PP:

25 KG

Master Batch:

0.50 KG

Bags:

1 KG

Stickers:

0.30 KG

Total Standard:

26.80 KG

Then separate section:

WASTAGE DETAILS

Overall Wastage:

1.20 KG

Primary Raw Material:

PP Plastic

Wastage Remarks:

Production wastage reported by Jobber.

System calculates:

Total Actual Consumption:

26.80 + 1.20

=

28.00 KG

30. RAW MATERIAL STOCK EFFECT OF WASTAGE

The system must deduct BOM quantities normally.

Example:

PP Standard:

25 KG

Master Batch:

0.50 KG

Bags:

1 KG

Stickers:

0.30 KG

Overall Wastage:

1.20 KG

Primary Material:

PP Plastic

Final Material Deduction:

PP Plastic:

25 + 1.20

=

26.20 KG

Master Batch:

0.50 KG

Bags:

1.00 KG

Stickers:

0.30 KG

31. WHY WASTAGE IS APPLIED TO PRIMARY MATERIAL

Since user enters only one total wastage KG and does not identify material-wise wastage, the application requires an accounting rule for inventory reconciliation.

Therefore:

Overall Wastage is deducted from the BOM's Primary Raw Material.

This usually represents the main plastic resin/material.

Do not divide wastage automatically among all BOM components.

Do not calculate wastage proportionately across materials.

32. PRODUCT INWARD PREVIEW

Before Posting show:

Production Details

Jobber:

ABC Plastics

Product:

1 Litre Bottle

Quantity:

1,000 PCS

BOM:

V1

BOM CONSUMPTION

MaterialJobber Stock BeforeStandard ConsumptionClosing Before WastagePP Plastic100.00025.00075.000Master Batch3.0000.5002.500Bags5.0001.0004.000Sticker2.0000.3001.700

WASTAGE

Overall Wastage:

1.200 KG

Applied To:

PP Plastic

FINAL BALANCE

PP Plastic:

73.800 KG

Master Batch:

2.500 KG

Bags:

4.000 KG

Sticker:

1.700 KG

33. TOTAL CONSUMPTION SUMMARY

Display at bottom:

Standard Material Consumption:

26.800 KG

Overall Wastage:

1.200 KG

Actual Total Consumption:

28.000 KG

Finished Quantity:

1,000 PCS

34. WASTAGE PERCENTAGE

Calculate:

Overall Wastage % = Overall Wastage KG ÷ Total Standard Material Consumption KG × 100

Example:

Standard Total:

26.80 KG

Wastage:

1.20 KG

Wastage %:

4.48%

Also store this value for reporting.

35. PRODUCT INWARD POSTING PROCESS

When the user presses:

POST VOUCHER

System must perform:

Validate Product and Jobber.

Validate active BOM.

Calculate all standard BOM quantities.

Validate Jobber material balances.

Read Overall Wastage KG.

Identify BOM Primary Raw Material.

Verify Primary Raw Material has sufficient stock for Standard Consumption + Overall Wastage.

Deduct standard BOM quantity from each Raw Material.

Deduct Overall Wastage from Primary Raw Material.

Create Raw Material Ledger entries.

Increase Finished Goods Stock.

Create Finished Goods Ledger entry.

Store Overall Wastage against Product Inward Voucher.

Mark Voucher as Posted.

Lock Posted Voucher.

36. PRODUCT INWARD STOCK VALIDATION

Example:

Jobber PP Available:

25.50 KG

Standard PP Consumption:

25 KG

Overall Wastage:

1.20 KG

Required PP:

26.20 KG

Available:

25.50 KG

Show:

Insufficient PP Plastic stock with ABC Plastics.

Available:

25.500 KG

Standard Consumption:

25.000 KG

Overall Wastage:

1.200 KG

Total Required:

26.200 KG

Shortage:

0.700 KG

Do not post the voucher.

37. PARTIAL PRODUCTION

Support unlimited partial production inward vouchers.

Example:

Material sent for approximately:

5,000 bottles

Jobber delivers:

Voucher 1:

1,000 PCS

Voucher 2:

1,200 PCS

Voucher 3:

800 PCS

Voucher 4:

2,000 PCS

Each Product Inward gets its own manually entered:

OVERALL WASTAGE KG

Example:

PIN001:

1.20 KG

PIN002:

0.80 KG

PIN003:

1.50 KG

PIN004:

0.95 KG

Store each independently.

38. SAME JOBBER CAN HAVE DIFFERENT WASTAGE

Never assume fixed Jobber wastage.

Example:

ABC Plastics

Voucher 1:

1.20 KG

Voucher 2:

0.80 KG

Voucher 3:

1.40 KG

This must be allowed.

39. DIFFERENT JOBBERS CAN HAVE DIFFERENT WASTAGE

Example:

Same Product:

1,000 Bottles

Same BOM.

ABC Plastics:

Overall Wastage:

1.20 KG

XYZ Industries:

Overall Wastage:

2.10 KG

PQR Plastics:

Overall Wastage:

0.95 KG

Each voucher stores the actual manually entered value.

40. MATERIAL RETURN FROM JOBBER

Create:

MATERIAL RETURN FROM JOBBER VOUCHER

Fields:

Voucher Number

Date

Jobber

Material

Current Jobber Stock

Return Quantity

Reference

Remarks

Status

Posting:

Jobber Stock decreases.

Warehouse Stock increases.

41. MATERIAL RETURN EXAMPLE

ABC Plastics PP Stock:

73.80 KG

Material Returned:

20 KG

New Jobber Stock:

53.80 KG

Warehouse Stock increases:

20 KG

42. STOCK ADJUSTMENT VOUCHER

Create:

STOCK ADJUSTMENT

Locations:

Warehouse

Jobber

Finished Goods

Types:

Positive Adjustment

Negative Adjustment

Fields:

Voucher Number

Date

Stock Location

Jobber, if applicable

Material / Product

Quantity

Adjustment Type

Reason

Remarks

Status

All adjustments must create ledger entries.

43. PHYSICAL JOBBER STOCK RECONCILIATION

Create:

JOBBER STOCK RECONCILIATION

User selects:

Jobber

Reconciliation Date

Display system stock.

Allow entry of Physical Stock.

Example:

System PP Stock:

53.80 KG

Physical PP:

53.20 KG

Difference:

-0.60 KG

User may create Stock Adjustment with:

Reason

Remarks

Authorization

Do not silently change stock.

44. WAREHOUSE STOCK FORMULA

Warehouse Closing Stock =

Opening Stock

Raw Material Inward

Material Returned from Jobbers

Positive Adjustment

Material Sent to Jobbers

Negative Adjustment

45. JOBBER STOCK FORMULA

For normal BOM materials:

Jobber Closing Stock =

Opening

Material Received

Standard BOM Consumption

Material Returned

+/- Adjustments

For Primary Raw Material:

Jobber Closing Stock =

Opening

Material Received

Standard BOM Consumption

Overall Voucher Wastage

Material Returned

+/- Adjustments

46. TOTAL COMPANY STOCK FORMULA

Total Unconsumed Raw Material = Warehouse Stock + Stock at All Jobbers

47. FINISHED GOODS STOCK

Product Inward increases Finished Goods stock.

Fields displayed:

Product

Opening

Product Inward

Other Inward

Outward

Adjustments

Closing Stock

Finished Product UOM:

PCS

48. FINISHED GOODS FORMULA

Closing Finished Goods =

Opening

Product Inward

Positive Adjustment

Finished Goods Outward

Negative Adjustment

49. COMPLETE EXAMPLE

Initial Warehouse:

PP Plastic:

500 KG

Master Batch:

20 KG

Bags:

30 KG

Stickers:

10 KG

Transfer to ABC Plastics:

PP:

100 KG

Master Batch:

3 KG

Bags:

5 KG

Stickers:

2 KG

After Transfer:

Warehouse PP:

400 KG

Jobber PP:

100 KG

50. PRODUCT INWARD EXAMPLE

Jobber:

ABC Plastics

Product:

1 Litre Bottle

Quantity:

1,000 PCS

BOM:

PP:

25 KG

Master Batch:

0.50 KG

Bags:

1 KG

Stickers:

0.30 KG

Total Standard Consumption:

26.80 KG

51. MANUAL WASTAGE EXAMPLE

Operator manually calculates total production wastage and enters:

Overall Wastage:

1.20 KG

Primary Material:

PP Plastic

System calculates:

PP Actual Deduction:

25 + 1.20

=

26.20 KG

Other deductions:

Master Batch:

0.50 KG

Bags:

1 KG

Sticker:

0.30 KG

Total Actual Consumption:

28 KG

52. JOBBER BALANCE AFTER PRODUCTION

Before:

PP:

100 KG

Master Batch:

3 KG

Bags:

5 KG

Sticker:

2 KG

After:

PP:

73.80 KG

Master Batch:

2.50 KG

Bags:

4 KG

Sticker:

1.70 KG

Finished Goods:

1 Litre Bottle:

1,000 PCS

53. SECOND PRODUCTION FROM SAME JOBBER

ABC Plastics sends another:

1,000 Bottles

Standard BOM remains the same.

But manually calculated wastage this time:

0.80 KG

PP deduction:

25 + 0.80

=

25.80 KG

Previous PP Jobber Stock:

73.80 KG

New Balance:

48.00 KG

Therefore each voucher has independent wastage.

54. JOBBER RECONCILIATION

Create Jobber Reconciliation Report.

Formula:

Opening Jobber Stock

Material Transferred to Jobber

Positive Adjustments

Standard BOM Consumption

Overall Voucher Wastage

Material Returned

Negative Adjustments

=

Closing Jobber Stock

55. RECONCILIATION EXAMPLE

ABC Plastics PP:

Opening:

0 KG

Material Sent:

100 KG

Voucher 1 Standard:

25 KG

Voucher 1 Wastage:

1.20 KG

Voucher 2 Standard:

25 KG

Voucher 2 Wastage:

0.80 KG

Closing:

100 - 25 - 1.20 - 25 - 0.80

=

48 KG

56. WASTAGE REPORT

Create:

OVERALL WASTAGE REPORT

Columns:

Date

Voucher Number

Jobber Code

Jobber Name

Product

Finished Quantity

BOM Version

Total Standard Consumption

Overall Wastage KG

Overall Wastage %

Primary Raw Material

Actual Total Consumption

Batch Number

Wastage Remarks

Filters:

From Date

To Date

Jobber

Product

Voucher

Batch

57. JOBBER-WISE WASTAGE REPORT

Create:

JOBBER WASTAGE ANALYSIS

Example:

JobberProduction QtyStandard MaterialTotal WastageWastage %ABC Plastics50,000 PCS1,340 KG35 KG2.61%XYZ Industries50,000 PCS1,340 KG60 KG4.48%

Filters:

Date Range

Product

Jobber

58. PRODUCT-WISE WASTAGE REPORT

Display:

Product

Jobber

Production Quantity

Standard Consumption

Overall Wastage

Wastage %

Number of Product Inward Vouchers

59. VOUCHER-WISE WASTAGE HISTORY

Every Product Inward Voucher should show its own wastage history.

Example:

PIN-2026-0001

ABC Plastics

1,000 Bottles

Standard:

26.80 KG

Overall Wastage:

1.20 KG

Actual Total:

28 KG

PIN-2026-0002

ABC Plastics

1,000 Bottles

Standard:

26.80 KG

Overall Wastage:

0.80 KG

Actual Total:

27.60 KG

60. JOBBER PERFORMANCE REPORT

Show:

Jobber

Product

Total Finished Quantity

Number of Production Vouchers

Total Standard Consumption

Total Wastage

Average Wastage %

Highest Wastage Voucher

Lowest Wastage Voucher

This is for management analysis.

61. DASHBOARD

Create modern ERP-style dashboard.

KPI Cards:

Warehouse Raw Material Stock

Raw Material at Jobbers

Total Company Raw Material

Finished Goods Stock

Active Jobbers

Material Sent This Month

Production Received This Month

Overall Wastage This Month

Dashboard tables:

Jobber Stock Summary

Recent Material Transfers

Recent Product Inward

Low Stock Materials

High Wastage Vouchers

Dashboard charts:

Monthly Production

Monthly Wastage

Jobber-wise Wastage

Product-wise Production

62. RAW MATERIAL LEDGER

Create Raw Material Ledger.

Fields:

Date

Voucher Number

Transaction Type

Material

Location

Jobber

Quantity In

Quantity Out

Standard Consumption

Overall Wastage, where applicable

Closing Balance

Remarks

For Product Inward:

Primary Material ledger should clearly distinguish:

Standard Consumption

Wastage

even though both reduce stock.

63. JOBBER LEDGER

Allow selecting one Jobber.

Display:

Date

Voucher

Transaction

Material

Inward

Standard Consumption

Wastage

Return

Adjustment

Closing Balance

64. FINISHED GOODS LEDGER

Fields:

Date

Voucher

Jobber

Finished Product

Quantity In

Quantity Out

Adjustments

Balance

65. VOUCHER STATUS

All vouchers must support:

DRAFT

Does not affect inventory.

POSTED

Updates inventory.

CANCELLED

Reverses original inventory transactions.

Do not permanently delete Posted vouchers.

66. POSTED VOUCHER RULES

Once a Product Inward Voucher is Posted:

Do not allow direct editing of:

Jobber

Product

Quantity

BOM

Wastage

If a correction is necessary:

Cancel original voucher.

Create reverse ledger transactions.

Create corrected voucher.

67. AUDIT TRAIL

Record:

Created By

Created At

Modified By

Modified At

Posted By

Posted At

Cancelled By

Cancelled At

Cancellation Reason

Also audit changes to:

BOM

Product Quantity

Overall Wastage

Stock Adjustment

68. PRINTABLE PRODUCT INWARD VOUCHER

Create professional A4 Product Inward Voucher.

Header:

Company

Voucher Number

Date

Jobber

Challan

Finished Product

Quantity

Batch

BOM Version

BOM Table:

MaterialStandard QtyJobber Balance BeforeBalance After

Then separate:

WASTAGE DETAILS

Overall Wastage:

1.200 KG

Applied To:

PP Plastic

Wastage Remarks:

Summary:

Standard Consumption:

26.800 KG

Overall Wastage:

1.200 KG

Actual Consumption:

28.000 KG

Finished Quantity:

1,000 PCS

Signatures:

Prepared By

Checked By

Authorized By

69. PRINTABLE MATERIAL TRANSFER VOUCHER

Include:

Company Details

Voucher

Date

Jobber

Challan

Vehicle

Materials

Quantity

Total KG

Remarks

Prepared By

Authorized By

Received By

70. REPORT EXPORT

Provide:

PDF Export

Excel Export

CSV Export

Print

71. SEARCH AND FILTER

Provide:

From Date

To Date

Jobber

Product

Raw Material

Voucher Number

Batch

Status

Use searchable dropdowns.

72. NAVIGATION

Left Sidebar:

Dashboard

Masters

Jobber Master

Raw Material Master

Finished Product Master

BOM Master

Inventory

Warehouse Stock

Jobber Stock

Finished Goods Stock

Raw Material Ledger

Finished Goods Ledger

Transactions

Raw Material Inward

Material Transfer to Jobber

Product Inward from Jobber

Material Return from Jobber

Stock Adjustment

Reports

Warehouse Stock

Jobber Stock

Consolidated Stock

Raw Material Ledger

Jobber Ledger

Material Transfer Register

Product Inward Register

BOM Consumption

Overall Wastage Report

Jobber-wise Wastage

Product-wise Wastage

Jobber Performance

Jobber Reconciliation

Finished Goods

Administration

Users

Roles

Permissions

Company Settings

Audit Trail

73. USER ROLES

ADMIN

Full Access.

STORE / INVENTORY USER

Can:

Raw Material Inward

Material Transfer

Product Inward

Enter Overall Wastage

Material Return

Stock View

MANAGEMENT

Can:

Dashboard

Reports

Jobber Performance

Wastage Analysis

Reconciliation

ACCOUNTS / VIEWER

Read-only.

74. RECOMMENDED DATABASE TABLES

Use Supabase/PostgreSQL.

jobbers

id

code

name

company_name

contact_person

phone

email

address

city

state

gst_number

pan_number

status

raw_materials

id

code

name

category

uom

minimum_stock

status

finished_products

id

code

name

category

uom

status

bom_headers

id

bom_number

product_id

version

base_quantity

effective_from

effective_to

active

bom_items

id

bom_id

material_id

standard_quantity

is_primary_material

raw_material_inward_headers

id

voucher_number

voucher_date

transaction_type

supplier_reference

status

remarks

raw_material_inward_items

id

header_id

material_id

quantity

jobber_transfer_headers

id

voucher_number

voucher_date

jobber_id

challan_number

vehicle_number

reference

status

remarks

jobber_transfer_items

id

header_id

material_id

quantity

product_inward_headers

id

voucher_number

voucher_date

jobber_id

product_id

finished_quantity

bom_id

batch_number

jobber_challan_number

total_standard_consumption

overall_wastage_kg

wastage_percentage

primary_material_id

actual_total_consumption

wastage_remarks

status

remarks

IMPORTANT:

overall_wastage_kg must be stored at Product Inward Voucher Header level.

There must NOT be material-wise wastage values.

product_inward_consumption

id

product_inward_id

material_id

standard_consumption

stock_before

stock_after

For Primary Raw Material, stock_after must include the Overall Wastage deduction.

material_return_headers

id

voucher_number

voucher_date

jobber_id

status

remarks

material_return_items

id

header_id

material_id

quantity

stock_adjustments

id

voucher_number

voucher_date

location_type

jobber_id

material_id

product_id

adjustment_type

quantity

reason

status

raw_material_ledger

id

transaction_date

transaction_type

voucher_type

voucher_id

voucher_number

material_id

location_type

jobber_id

quantity_in

quantity_out

standard_consumption

wastage_quantity

remarks

The wastage_quantity field should only contain the overall wastage on the Primary Raw Material ledger entry.

finished_goods_ledger

id

transaction_date

transaction_type

voucher_id

product_id

jobber_id

quantity_in

quantity_out

users

roles

permissions

audit_logs

75. DATABASE POSTING MUST BE ATOMIC

All voucher posting must use database transactions.

Example Product Inward posting:

Validate voucher.

Validate BOM.

Validate Jobber balances.

Calculate Standard Consumption.

Validate Overall Wastage.

Identify Primary Raw Material.

Validate Standard + Wastage stock.

Create Raw Material Ledger transactions.

Update Jobber balances.

Create Finished Goods Ledger.

Update Finished Goods balance.

Save Overall Wastage.

Mark Voucher Posted.

If any operation fails:

ROLLBACK ALL OPERATIONS

Never partially update inventory.

76. STOCK SOURCE OF TRUTH

The transaction ledger must be the primary source of truth.

Do not depend only on manually editable Current Stock fields.

Current stock can be cached for speed, but it must always reconcile with transaction ledgers.

77. VALIDATION RULES

Prevent:

Negative Warehouse Stock

Negative Jobber Stock

Negative Finished Goods Stock

Negative Wastage

Material Transfer exceeding Warehouse balance

Product Inward without BOM

Product Inward without Primary Raw Material

Product Inward Quantity = 0

Material Return exceeding Jobber balance

Standard Consumption exceeding Jobber stock

Primary Material Standard Consumption + Overall Wastage exceeding Jobber balance

Editing Posted vouchers

78. WASTAGE VALIDATION

Overall Wastage field:

Minimum:

0.000 KG

Allow:

0.000 KG

Do not automatically calculate wastage.

Do not force a percentage.

The user manually enters the final overall wastage value.

Optional:

Management can configure a warning threshold.

Example:

If:

Overall Wastage % > 5%

Show:

Warning: Wastage for this production voucher is above the configured threshold.

This should be a warning, not necessarily a posting block.

79. PRODUCT INWARD USER EXPERIENCE

Make Product Inward extremely simple.

Flow:

Select Jobber

↓

Select Finished Product

↓

Enter Finished Quantity

↓

System loads BOM

↓

System calculates Standard Material Consumption

↓

System shows Current Jobber Stock

↓

System shows BOM Consumption table

↓

Separate Wastage Card appears below

↓

User enters:

Overall Wastage KG

↓

System automatically applies wastage to Primary Raw Material

↓

System recalculates balances

↓

System displays Total Standard Consumption

↓

System displays Overall Wastage

↓

System displays Actual Total Consumption

↓

Preview

↓

Post Voucher

The operator should not need to manually calculate BOM quantities.

80. UI STYLE

Build professional ERP-style interface.

Desktop-first and responsive.

Use:

Left Sidebar

KPI Cards

Data Tables

Searchable Dropdowns

Date Pickers

Editable Voucher Grids

Clear Wastage Card

Confirmation Dialogues

Status Badges

Toast Notifications

Breadcrumbs

Loading Indicators

Print

PDF

Excel

Priority:

Accuracy + Fast Voucher Entry + Clear Stock Position

81. FINAL TEST CASE 1

Warehouse PP:

500 KG

Transfer to ABC Plastics:

100 KG

Expected:

Warehouse:

400 KG

Jobber:

100 KG

Total Company PP:

500 KG

Product Inward:

1,000 Bottles

Standard PP:

25 KG

Other Standard BOM Materials:

1.80 KG

Total Standard:

26.80 KG

Manual Overall Wastage:

1.20 KG

Primary Material:

PP Plastic

Expected:

PP deduction:

26.20 KG

Jobber PP Closing:

73.80 KG

Actual Total Material Consumption:

28 KG

Finished Goods:

1,000 Bottles

82. FINAL TEST CASE 2

Same Product.

XYZ Industries receives:

100 KG PP.

Production:

1,000 Bottles

Standard Total:

26.80 KG

Manually entered Overall Wastage:

2 KG

Primary:

PP

PP Standard:

25 KG

PP Actual Deduction:

27 KG

XYZ PP Closing:

73 KG

System must retain:

ABC Voucher Wastage:

1.20 KG

XYZ Voucher Wastage:

2.00 KG

independently.

83. FINAL TEST CASE 3

ABC Plastics manufactures another:

1,000 bottles

Current PP:

73.80 KG

Standard PP:

25 KG

New Overall Wastage manually entered:

0.80 KG

PP Actual:

25.80 KG

New ABC PP:

48 KG

The new voucher must NOT automatically use previous wastage of 1.20 KG.

84. MANAGEMENT QUESTIONS THE SYSTEM MUST ANSWER

Management must instantly know:

How much Raw Material is available in Warehouse?

How much Raw Material is lying with each Jobber?

What material was sent to each Jobber?

How much Finished Product did each Jobber manufacture?

What was Standard BOM Consumption?

What was Overall Wastage for each Product Inward Voucher?

Which Jobber has higher wastage?

What is the average wastage of each Jobber?

What is the wastage percentage for each production voucher?

What was Actual Total Material Consumption?

What Raw Material should still be physically available with the Jobber?

What material was returned by the Jobber?

What Finished Goods are available?

Which BOM Version was used?

Can every KG of company-owned Raw Material be reconciled?

85. DEVELOPMENT SEQUENCE

Build in this sequence.

PHASE 1 - FOUNDATION

Authentication

Users

Roles

Permissions

Company Settings

PHASE 2 - MASTERS

Jobber Master

Raw Material Master

Finished Product Master

BOM Master

Primary Raw Material Setup

BOM Versioning

PHASE 3 - WAREHOUSE

Raw Material Inward

Warehouse Stock

Raw Material Ledger

PHASE 4 - JOB WORK

Material Transfer to Jobber

Jobber Stock

Jobber Ledger

PHASE 5 - PRODUCTION

Product Inward Voucher

Automatic BOM Calculation

Standard Consumption

Separate Overall Wastage Section

Manual Overall Wastage Entry

Wastage Application to Primary Material

Finished Goods Stock

PHASE 6 - RECONCILIATION

Material Return

Stock Adjustment

Jobber Physical Reconciliation

PHASE 7 - MANAGEMENT & REPORTING

Dashboard

Warehouse Reports

Jobber Reports

BOM Consumption

Overall Wastage Report

Jobber-wise Wastage

Product-wise Wastage

Jobber Performance

Reconciliation

Finished Goods

PDF Export

Excel Export

Audit Trail

86. FINAL CORE FORMULAS

Standard Material Consumption

Finished Quantity ÷ BOM Base Quantity × BOM Material Quantity

Total Standard Consumption

Sum of all BOM Material Consumption

Actual Total Consumption

Total Standard Consumption + Manually Entered Overall Wastage

Primary Material Actual Deduction

Primary Material Standard Consumption + Overall Wastage

Other Material Deduction

Standard BOM Consumption Only

Warehouse Stock

Opening + Inward + Jobber Returns - Material Transfers +/- Adjustments

Jobber Stock

Opening + Material Received - BOM Consumption - Overall Wastage Applied to Primary Material - Returns +/- Adjustments

Total Company Raw Material

Warehouse Stock + Stock at All Jobbers

87. FINAL DEVELOPMENT INSTRUCTION

Do not build static mock screens only.

Build a fully functional end-to-end web application using:

Supabase

PostgreSQL

Authentication

Relational Database

Stock Ledgers

BOM Versioning

Warehouse Inventory

Jobber Inventory

Material Transfer Vouchers

Product Inward Vouchers

Automatic BOM Calculation

Separate Overall Wastage Section

Manual Overall Wastage Entry per Voucher

Automatic Wastage Deduction from Primary Raw Material

Finished Goods Inventory

Material Return

Stock Adjustment

Jobber Reconciliation

Dashboard

Reports

PDF

Excel

User Roles

Audit Trail

Database Transaction Rollback

The system must never calculate wastage item-wise.

The system must never store fixed wastage in BOM.

The system must never store fixed wastage in Jobber Master.

The system must never reuse previous voucher wastage automatically.

Every Product Inward Voucher must have its own manually entered:

OVERALL WASTAGE KG

The final audit flow must be:

Raw Material Inward → Warehouse → Material Transfer to Jobber → Jobber Stock → Finished Product Inward → Standard BOM Consumption → Manual Overall Wastage → Actual Consumption → Finished Goods → Remaining Jobber Stock → Material Return / Reconciliation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jobberflow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/36e10183-bd94-4a33-9969-ac07234a1588).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
