#!/bin/bash
(
  cd common &&
  yarn &&
  yarn build &&
  cd ../app &&
  yarn add file:../common &&
  tsc
)