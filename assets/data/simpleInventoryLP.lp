Minimize
 + 22.0 x1 + 5.0 i1,2 + 42.0 x2 + 11.0 i2,3 + 100.0 x3 + 4.0 i3,4
 + 1000.0 x4 + 450.0 x5
Subject To
Demand1: i0,1 + x1 - i1,2 = 10.0
Demand2: i1,2 + x2 - i2,3 = 80.0
Demand3: i2,3 + x3 - i3,4 = 100.0
Demand4: i3,4 + x4 - i4,5 = 20.0
Demand5: i4,5 + x5 - i5,6 = 440.0
ProdCap1: x1 <= 500.0
ProdCap2: x2 <= 100.0
ProdCap3: x3 <= 90.0
ProdCap4: x4 <= 500.0
ProdCap5: x5 <= 1000.0
InvCap1: i1,2 <= 100.0
InvCap2: i2,3 <= 100.0
InvCap3: i3,4 <= 100.0
InvCap4: i4,5 <= 20.0
InvCap0: i0,1 = 0
END
