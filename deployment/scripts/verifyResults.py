from collections import OrderedDict
import json
from unicodedata import name
with open("./oas-k6-functional/scripts/summary.json") as data_file:
    my_data = json.load(data_file)
results = my_data['root_group']['groups']
total_testcases_passed = 0
total_testcases_failed = 0
status = dict()
for scenario in results:
  current_scenario = results[scenario]['groups']
  for test in current_scenario:
    current_testcase = current_scenario[test]['checks']
    for checkPoint in current_testcase:
      current_checkPoint= current_testcase[checkPoint]
      if current_checkPoint['passes'] > 0:
        total_testcases_passed= total_testcases_passed+1
        status[current_checkPoint['name']] = 'Passed'
      elif current_checkPoint['fails'] > 0:
        total_testcases_failed= total_testcases_failed+1
        status[current_checkPoint['name']] = 'failed'
      current_checkPoint.clear()
print("total_testcases_passed", total_testcases_passed)
print("total_testcases_failed", total_testcases_failed)
for key,value in status.items():
    print(key,"----->",value)
"""
with open("./oas-k6-functional/scripts/summary2.json") as data_file:
    my_data = json.load(data_file)
results = my_data['root_group']['checks']
for item in results:
  current_testcase = results[item]
  if current_testcase['passes'] > 0:
    total_testcases_passed= total_testcases_passed+1
    status[current_testcase['name']] = 'Passed'
  elif current_testcase['fails'] > 0:
    total_testcases_failed= total_testcases_failed+1
    status[current_testcase['name']] = 'failed'
  current_testcase.clear()
print("total_testcases_passed", total_testcases_passed)
print("total_testcases_failed", total_testcases_failed)
for key,value in status.items():
    print(key,"----->",value)
"""