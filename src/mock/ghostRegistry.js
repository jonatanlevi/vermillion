/**
 * כל פרסונות הרפאים — מקור יחיד ל-QA ולמסך משחק 14 יום.
 */
import { ghostUser } from './ghostUser';
import { ghostMiriam } from './ghostMiriam';
import { ghostRoni } from './ghostRoni';
import { ghostNoa } from './ghostNoa';
import { ghostYosef } from './ghostYosef';
import { ghostDana } from './ghostDana';
import { ghostOmer } from './ghostOmer';
import { ghostRachel } from './ghostRachel';
import { ghostMohammad } from './ghostMohammad';
import { ghostShimi } from './ghostShimi';
import { ghostGalit } from './ghostGalit';
import { ghostDavid } from './ghostDavid';

export const ALL_GHOSTS = [
  ghostUser,
  ghostMiriam,
  ghostRoni,
  ghostNoa,
  ghostYosef,
  ghostDana,
  ghostOmer,
  ghostRachel,
  ghostMohammad,
  ghostShimi,
  ghostGalit,
  ghostDavid,
];

export function getGhostById(id) {
  return ALL_GHOSTS.find((g) => g.id === id) || null;
}
