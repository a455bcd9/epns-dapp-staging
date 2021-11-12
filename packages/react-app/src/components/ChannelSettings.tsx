import React from "react";

import {
  Section,
  Content,
  Item,
  ItemH,
  ItemBreak,
  H1,
  H2,
  H3,
  Image,
  P,
  Span,
  Anchor,
  Button,
  Showoff,
  FormSubmision,
  Input,
  TextField,
} from "components/SharedStyling";
import { useClickAway } from "react-use";
import styled, { css } from "styled-components";


import Dropdown from "react-dropdown";
import Slider from "@material-ui/core/Slider";

import "react-dropdown/style.css";

import "react-toastify/dist/ReactToastify.min.css";

import { useWeb3React } from "@web3-react/core";

import { addresses, abis } from "@project/contracts";
import EPNSCoreHelper from "helpers/EPNSCoreHelper";
import { postReq } from "api";
import Loader from 'react-loader-spinner';

const ethers = require("ethers");

const CHANNNEL_DEACTIVATED_STATE = 2;
const CHANNEL_BLOCKED_STATE = 3;
const CHANNEL_ACTIVE_STATE = 1;
const MIN_STAKE_FEES = 50;

// Create Header
function ChannelSettings() {
  const { active, error, account, library, chainId } = useWeb3React();
  const popupRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [channelState, setChannelState] = React.useState(CHANNEL_ACTIVE_STATE);
  const [showPopup, setShowPopup] = React.useState(false);
  const [channelStakeFees, setChannelStakeFees] = React.useState(MIN_STAKE_FEES);


  useClickAway(popupRef, () => {
    if(showPopup){
      setShowPopup(false);
    }
  });

  const isChannelDeactivated = channelState === CHANNNEL_DEACTIVATED_STATE;
  const isChannelBlocked = channelState === CHANNEL_BLOCKED_STATE;

  const getChannelData = async (contract, channel) => {
    return new Promise((resolve, reject) => {
      console.log(contract, channel);
      // To get channel info from a channel address
      contract
        .channels(channel)
        .then((response) => {
          console.log("getChannelInfo() --> %o", response);
          setChannelState(response.channelState);
          resolve(response.poolContribution);
        })
        .catch((err) => {
          console.log("!!!Error, getChannelInfo() --> %o", err);
          reject(err);
        });
    });
  };

  const toggleChannel = () => {
    if(isChannelBlocked) return;
    if(isChannelDeactivated){
      setShowPopup(true)
    }else{
      deactivateChannel();
    }
  }

  const activateChannel = async () => {
    setLoading(true);
    // post op
    console.log(channelStakeFees);
    setLoading(false);
    setChannelState(CHANNEL_ACTIVE_STATE);
    setShowPopup(false);
  }

  const deactivateChannel = async () => {
    setLoading(true);
    var signer = library.getSigner(account);
    let contract = new ethers.Contract(
      addresses.epnscore,
      abis.epnscore,
      signer
    );

    var channelData = await getChannelData(
      contract,
      signer._address
    );

    var poolContribution = EPNSCoreHelper.formatBigNumberToMetric(
      channelData,
      true
    );

    const amountToBeConverted = parseInt(poolContribution) - 10;
    console.log("Amount To be converted==>", amountToBeConverted);

      
    const {data: response} = await postReq('/channels/get_dai_to_push', {
      value: amountToBeConverted
    });

    const pushValue = response.response.data.quote.PUSH.price;

    const amountsOut = pushValue * Math.pow(10, 18);

    console.log("amountsOut", amountsOut);
    setLoading(false);
    setChannelState(CHANNNEL_DEACTIVATED_STATE);

    // const deactivateRes = await contract.deactivateChannel(
    //   amountsOut
    // );

    // console.log(deactivateRes);
  }


  return (
    <>
      <Section>
        <Content padding="10px 10px">
          <Item align="flex-end">
            <ChannelActionButton
              onClick={toggleChannel}
            >
              <ActionTitle>
                { loading ?
                  <Loader
                    type="Oval"
                    color="#FFF"
                    height={16}
                    width={16}
                  /> : (isChannelBlocked ? "Channel Blocked" : (isChannelDeactivated ? "Activate Channel" : "Deactivate Channel"))
                }
              </ActionTitle>
            </ChannelActionButton>
          </Item>
        </Content>
        {
          showPopup && (
            <PopupOverlay >
              <PopupSlider ref={popupRef}>
              <Section>
                <Content padding="50px 0px 0px 0px">
                  <Item align="flex-start" margin="0px 20px">
                    <H3 color="#e20880">Set your staking fees in DAI</H3>
                  </Item>

                  <Item
                    margin="-10px 20px 20px 20px"
                    padding="20px 20px 10px 20px"
                    bg="#f1f1f1"
                  >
                    <Slider
                      defaultValue={MIN_STAKE_FEES}
                      onChangeCommitted={(event, value) => setChannelStakeFees(Number(value))}
                      aria-labelledby="discrete-slider"
                      valueLabelDisplay="auto"
                      step={MIN_STAKE_FEES}
                      marks
                      min={MIN_STAKE_FEES}
                      max={25000}
                    />
                    <Span
                      weight="400"
                      size="1.0em"
                      textTransform="uppercase"
                      spacing="0.2em"
                    >
                      Amount Staked: {channelStakeFees} DAI
                    </Span>
                  </Item>

                  <Item self="stretch" align="stretch" margin="20px 0px 0px 0px">
                    <Button
                      bg="#e20880"
                      color="#fff"
                      flex="1"
                      radius="0px"
                      padding="20px 10px"
                      onClick={activateChannel}
                    >
                      {loading ?
                        <Loader
                          type="Oval"
                          color="#FFF"
                          height={16}
                          width={16}
                        /> : (
                          <Span
                            color="#fff"
                            weight="400"
                            textTransform="uppercase"
                            spacing="0.1em"
                          >
                            Reactivate Channel
                          </Span>
                        ) 
                      }
                    </Button>
                  </Item>
                </Content>
              </Section>
              </PopupSlider>
            </PopupOverlay>
          )
        } 
      </Section>
    </>
  );
}

const PopupOverlay = styled.div`
  background: rgba(0,0,0,0.5);
  height: 100vh;
  width: 100vw;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  justify-content: center;
  align-items: center;
`;

const PopupSlider = styled.div`
    height: 200px;
    width: 70vw;
    background: white;
`;

// css styles
const Toaster = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0px 10px;
`;

const ActionTitle = styled.span`
  ${(props) =>
    props.hideit &&
    css`
      visibility: hidden;
    `};
`;

const ToasterMsg = styled.div`
  margin: 0px 10px;
`;

const DropdownStyledParent = styled.div`
  .is-open {
    margin-bottom: 130px;
  }
`;

const MultiRecipientsContainer = styled.div`
  width: 100%;
  padding: 0px 20px;
  padding-top: 10px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 7px 15px;

  span {
    color: white;
    background: #e20880;
    padding: 6px 10px;
    border-radius: 5px;

    i {
      cursor: pointer;
      margin-left: 25px;
    }
  }
`;
const Parent = styled(Section)`
  padding: 20px;
  margin: 0px 20px 0px 20px;
`;

const DropdownStyled = styled(Dropdown)`
  .Dropdown-control {
    background-color: #000;
    color: #fff;
    padding: 12px 52px 12px 10px;
    border: 1px solid #000;
    border-radius: 4px;
  }

  .Dropdown-placeholder {
    text-transform: uppercase;
    font-weight: 400;
    letter-spacing: 0.2em;
    font-size: 0.8em;
  }

  .Dropdown-arrow {
    top: 18px;
    bottom: 0;
    border-color: #fff transparent transparent;
  }

  .Dropdown-menu {
    border: 1px solid #000;
    box-shadow: none;
    background-color: #000;
    border-radius: 0px;
    margin-top: -3px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .Dropdown-option {
    background-color: rgb(35 35 35);
    color: #ffffff99;

    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.7em;
    padding: 15px 20px;
  }

  .Dropdown-option:hover {
    background-color: #000000;
    color: #fff;
  }
`;

const ChannelActionButton = styled.button`
  border: 0;
  outline: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  margin: 10px;
  color: #fff;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 400;
  position: relative;
  background-color: #674c9f;
  &:hover {
    opacity: 0.9;
    cursor: pointer;
    pointer: hand;
  }
  &:active {
    opacity: 0.75;
    cursor: pointer;
    pointer: hand;
  }
`;

// Export Default
export default ChannelSettings;
