import { useAtom } from "jotai";
import DeleteIcon from "@mui/icons-material/Delete";
import GameIcon from "@mui/icons-material/Gamepad";
import partsStorageAtom from "../../state/partsStorageAtom";
import { baseSceneAtom } from "../../state/atoms";

export function SideButtons() {
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const [scene, setScene] = useAtom(baseSceneAtom);
	const selectedPart = partsStorage.selectedPart;
	return (
		<div className="SidebuttonsUI-container">
			{selectedPart != null && (
				<div id="trash-icon">
					<DeleteIcon style={{ color: "#f00", fontSize: 36 }} />
				</div>
			)}
			<div
				id="game-icon"
				onClick={() => {
					setScene(scene === "editor" ? "game" : "editor");
				}}
			>
				<GameIcon style={{ color: "#fff", fontSize: 36 }} />
			</div>
		</div>
	);
}
